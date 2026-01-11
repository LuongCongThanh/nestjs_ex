import { AuthResponseDto } from '@modules/auth/dto/auth-response.dto';
import { LoginDto } from '@modules/auth/dto/login.dto';
import { RegisterDto } from '@modules/auth/dto/register.dto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   * Steps:
   * 1. Check if email already exists
   * 2. Hash password with bcrypt (10 rounds)
   * 3. Create and save user to database
   * 4. Generate JWT token
   * 5. Return token and user info (without password)
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
      select: ['id'], // Only select id for existence check
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user entity
    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
    });

    // Save to database
    const savedUser = await this.userRepository.save(user);

    // Exclude password from response using destructuring
    const { password: _, ...userWithoutPassword } = savedUser;

    // Generate JWT token
    const access_token = this.generateToken(savedUser);

    return {
      access_token,
      user: userWithoutPassword as User,
    };
  }

  /**
   * Login user
   * Steps:
   * 1. Find user by email
   * 2. Verify password with bcrypt.compare
   * 3. Check if user is active
   * 4. Generate JWT token
   * 5. Return token and user info (without password)
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
        'emailVerified',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account has been disabled');
    }

    // Exclude password from response using destructuring
    const { password: _, ...userWithoutPassword } = user;

    // Generate JWT token
    const access_token = this.generateToken(user);

    return {
      access_token,
      user: userWithoutPassword as User,
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'isActive',
        'emailVerified',
        'createdAt',
        'updatedAt',
      ], // Exclude password from selection
    });

    if (!user) {
      return null;
    }

    return user;
  }

  generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }
}
