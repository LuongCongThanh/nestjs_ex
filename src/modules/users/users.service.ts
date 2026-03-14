import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from '../auth/services/password.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PasswordService))
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Tạo user mới
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await this.passwordService.hash(createUserDto.password);

    return await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });
  }

  /**
   * Lấy danh sách users với pagination và filters
   */
  async findAll(query: FindUsersQueryDto) {
    const { page = 1, limit = 10, search, role, isActive } = query;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Tìm user theo ID
   */
  async findOne(id: string): Promise<User> {
    // Validate UUID format to prevent Prisma from crashing
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new BadRequestException(`Invalid UUID format: ${id}`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Tìm user theo email (dùng cho authentication)
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Cập nhật thông tin user
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.findOne(id);

    return await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  /**
   * Xóa user (soft delete)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Đánh dấu email đã được verified
   */
  async verifyEmail(id: string): Promise<User> {
    await this.findOne(id);

    return await this.prisma.user.update({
      where: { id },
      data: { emailVerified: true },
    });
  }

  /**
   * Đổi password
   */
  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, password: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await this.passwordService.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashedPassword = await this.passwordService.hash(newPassword);
    await this.prisma.user.update({
      where: { id: id },
      data: { password: hashedPassword },
    });
  }
}
