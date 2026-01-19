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

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
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
      throw new NotFoundException(`User with ID "${id}" not found`);
    }

    return user;
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
   * Sử dụng TypeORM's softRemove để đánh dấu user là đã xóa.
   * User vẫn tồn tại trong database nhưng sẽ có trường `deletedAt` được set.
   *
   * @param id - User UUID
   * @throws NotFoundException - Nếu user không tồn tại
   */
  async softDelete(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softRemove(user);
  }
}
