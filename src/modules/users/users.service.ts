/**
 * Users Service - Business Logic Layer cho User Management
 *
 * Service này chịu trách nhiệm:
 * - Xử lý tất cả business logic liên quan đến users
 * - Tương tác với database qua TypeORM Repository
 * - Hash passwords bằng bcryptjs
 * - Validate và throw các custom exceptions
 *
 * Methods:
 * - create(): Tạo user mới (kiểm tra email unique, hash password)
 * - findAll(): Lấy danh sách users với pagination và filters
 * - findOne(): Tìm user theo ID
 * - findByEmail(): Tìm user theo email (dùng cho authentication)
 * - update(): Cập nhật thông tin user
 * - remove(): Soft delete user
 * - verifyEmail(): Đánh dấu email đã verified
 * - changePassword(): Đổi password (verify old password trước)
 */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) // Inject TypeORM Repository để tương tác với User table
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Tạo user mới
   *
   * Steps:
   * 1. Kiểm tra email đã tồn tại chưa → throw ConflictException nếu có
   * 2. Hash password bằng bcrypt (salt rounds: 10)
   * 3. Tạo user entity và save vào database
   *
   * @param createUserDto - Data để tạo user mới
   * @returns User object (bao gồm cả password đã hash)
   * @throws ConflictException - Nếu email đã tồn tại
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create user entity
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    // Save to database và return
    return await this.userRepository.save(user);
  }

  /**
   * Lấy danh sách users với pagination và filters
   *
   * Features:
   * - Pagination: page, limit
   * - Search: Tìm kiếm theo email, firstName, lastName (case-insensitive với ILIKE)
   * - Filter by role: user | admin | staff
   * - Filter by isActive: true | false (default: true - chỉ show active users)
   *
   * Sử dụng QueryBuilder thay vì find() để:
   * - Apply nhiều filters động
   * - Search với ILIKE (case-insensitive)
   * - Pagination hiệu quả với skip/take
   *
   * @param query - Pagination và filter parameters
   * @returns Object { data: User[], meta: PaginationMeta }
   */
  async findAll(query: FindUsersQueryDto) {
    const { page = 1, limit = 10, search, role, isActive } = query;

    // Create query builder
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    // Apply filters dynamically
    if (search) {
      // ILIKE: case-insensitive search (PostgreSQL specific)
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` }, // % = wildcard (tìm kiếm bất kỳ đâu trong string)
      );
    }

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    } else {
      // Default: only show active users
      queryBuilder.andWhere('user.isActive = :isActive', { isActive: true });
    }

    // Apply pagination
    const skip = (page - 1) * limit; // Calculate offset
    queryBuilder.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    // Execute query: getManyAndCount() trả về [data, total] trong 1 query
    const [data, total] = await queryBuilder.getManyAndCount();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Tìm user theo ID
   *
   * @param id - User UUID
   * @returns User object
   * @throws NotFoundException - Nếu user không tồn tại
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Tìm user theo email (dùng cho authentication)
   *
   * Note: Method này KHÔNG throw exception nếu không tìm thấy
   * Trả về null để AuthService có thể handle
   *
   * @param email - User email
   * @returns User object hoặc null
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Cập nhật thông tin user
   *
   * Chỉ update các fields được gửi lên (partial update)
   * Sử dụng Object.assign để merge changes vào user entity
   *
   * @param id - User UUID
   * @param updateUserDto - Data cần update
   * @returns User object đã được cập nhật
   * @throws NotFoundException - Nếu user không tồn tại
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id); // Tự động throw 404 nếu không tìm thấy

    // Merge changes vào user entity
    Object.assign(user, updateUserDto);

    return await this.userRepository.save(user);
  }

  /**
   * Xóa user (soft delete)
   *
   * Soft delete: Chỉ set isActive = false, không xóa data
   * User vẫn tồn tại trong database nhưng:
   * - Không thể login
   * - Không hiện trong danh sách (GET /users filter isActive=true)
   * - Có thể restore nếu cần
   *
   * @param id - User UUID
   * @throws NotFoundException - Nếu user không tồn tại
   */
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);

    // Soft delete: chỉ set isActive = false
    user.isActive = false;
    await this.userRepository.save(user);
  }

  /**
   * Đánh dấu email đã được verified
   *
   * Dùng sau khi user click vào link verification trong email
   *
   * @param id - User UUID
   * @returns User object đã update
   * @throws NotFoundException - Nếu user không tồn tại
   */
  async verifyEmail(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.emailVerified = true;
    return await this.userRepository.save(user);
  }

  /**
   * Đổi password
   *
   * Steps:
   * 1. Verify old password có đúng không
   * 2. Hash new password
   * 3. Save vào database
   *
   * Note: Query với select: ['id', 'password'] để lấy password field
   * (mặc định password không được select do @Select(false) trong entity)
   *
   * @param id - User UUID
   * @param oldPassword - Password hiện tại (để verify)
   * @param newPassword - Password mới (sẽ được hash)
   * @throws NotFoundException - Nếu user không tồn tại
   * @throws BadRequestException - Nếu old password sai
   */
  async changePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Query với select password field (mặc định không được select)
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'password'], // Explicitly select password field
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password bằng bcrypt.compare()
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }
}
