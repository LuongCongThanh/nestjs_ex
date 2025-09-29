import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const hashed = await bcrypt.hash(createUserDto.password, 10);
      const created = await this.prisma.user.create({
        data: { ...createUserDto, password: hashed },
      });
      // remove password before returning
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = created as any;
      return rest as unknown as User;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Email is already being used by another user',
          );
        }
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      return users.map((u) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...rest } = u as any;
        return rest as unknown as User;
      });
    } catch (error) {
      throw new BadRequestException('Failed to retrieve users');
    }
  }

  async findOne(id: number): Promise<User> {
    if (!id || id <= 0) {
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user as any;
    return rest as unknown as User;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    await this.findOne(id);

    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused_vars
      const { password, ...rest } = updated as any;
      return rest as unknown as User;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            'Email is already being used by another user',
          );
        }
      }
      throw new BadRequestException('Failed to update user');
    }
  }

  async remove(id: number): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException('Failed to delete user');
    }
  }

  // Additional utility method for finding by email
  async findByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Method to check if email exists
  async emailExists(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return !!user;
  }
}
