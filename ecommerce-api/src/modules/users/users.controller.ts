/**
 * Users Controller - Quản lý các REST API endpoints cho User
 *
 * Controller này cung cấp 5 endpoints chuẩn RESTful:
 * - POST   /users       : Tạo user mới
 * - GET    /users       : Lấy danh sách users (có pagination và filters)
 * - GET    /users/:id   : Lấy thông tin 1 user theo ID
 * - PATCH  /users/:id   : Cập nhật thông tin user
 * - DELETE /users/:id   : Xóa mềm user (soft delete)
 *
 * Security:
 * - Tất cả passwords được hash bằng bcrypt trước khi lưu
 * - Password field không bao giờ được trả về trong response (nhờ ClassSerializerInterceptor)
 * - UUID validation tự động với ParseUUIDPipe
 *
 * Documentation:
 * - Swagger docs tại /api/docs
 * - Tất cả endpoints đều có @ApiOperation và @ApiResponse
 */

import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ConflictErrorResponseDto,
  ErrorResponseDto,
  NotFoundErrorResponseDto,
} from './dto/error-response.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@ApiTags('users') // Nhóm các API endpoints trong Swagger UI
@Controller('users') // Base route: /users
@UseInterceptors(ClassSerializerInterceptor) // Tự động loại bỏ các field có @Exclude decorator
export class UsersController {
  // Inject UsersService để xử lý business logic
  constructor(private readonly usersService: UsersService) {}

  /**
   * Tạo user mới
   * Endpoint: POST /users
   *
   * Request body:
   * - email: bắt buộc, phải unique và đúng format
   * - password: bắt buộc, min 8 ký tự, phải có chữ hoa, chữ thường, số/ký tự đặc biệt
   * - firstName, lastName, phone: optional
   * - role: optional (mặc định: 'user')
   *
   * Returns: User object (không bao gồm password)
   *
   * Errors:
   * - 400 Bad Request: Validation failed (email invalid, password weak, etc.)
   * - 409 Conflict: Email đã tồn tại trong hệ thống
   */
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 409, type: ConflictErrorResponseDto })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return await this.usersService.create(createUserDto);
  }

  /**
   * Lấy danh sách users với pagination và filters
   * Endpoint: GET /users?page=1&limit=10&search=john&role=user&isActive=true
   *
   * Query Parameters:
   * - page: Số trang (default: 1, min: 1)
   * - limit: Số items mỗi trang (default: 10, min: 1, max: 100)
   * - search: Tìm kiếm theo email, firstName, lastName (case-insensitive)
   * - role: Lọc theo role (user | admin | staff)
   * - isActive: Lọc theo trạng thái active (true | false, default: true)
   *
   * Returns: Object chứa:
   * - data: Array of users
   * - meta: Pagination metadata (page, limit, total, totalPages, hasNextPage, hasPreviousPage)
   *
   * Example:
   * GET /users?page=2&limit=5&search=john&role=admin
   */
  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200 })
  async findAll(@Query() query: FindUsersQueryDto) {
    return await this.usersService.findAll(query);
  }

  /**
   * Lấy thông tin chi tiết user theo ID
   * Endpoint: GET /users/:id
   *
   * Path Parameters:
   * - id: User UUID (tự động validate format bởi ParseUUIDPipe)
   *
   * Returns: User object đầy đủ thông tin (không có password)
   *
   * Errors:
   * - 400 Bad Request: ID không phải UUID hợp lệ
   * - 404 Not Found: User với ID này không tồn tại
   *
   * Example: GET /users/123e4567-e89b-12d3-a456-426614174000
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string, // ParseUUIDPipe tự động validate UUID format
  ): Promise<UserResponseDto> {
    return await this.usersService.findOne(id);
  }

  /**
   * Cập nhật thông tin user (partial update)
   * Endpoint: PATCH /users/:id
   *
   * Path Parameters:
   * - id: User UUID
   *
   * Request body (tất cả fields đều optional):
   * - firstName: Tên
   * - lastName: Họ
   * - phone: Số điện thoại
   * - role: Role (user | admin | staff)
   *
   * Lưu ý:
   * - Không thể update email (cần endpoint riêng)
   * - Không thể update password (dùng /users/:id/change-password)
   * - Chỉ gửi các fields cần update (partial update)
   *
   * Returns: User object đã được cập nhật
   *
   * Errors:
   * - 400 Bad Request: Validation failed
   * - 404 Not Found: User không tồn tại
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return await this.usersService.update(id, updateUserDto);
  }

  /**
   * Xóa user (soft delete - không xóa data thật)
   * Endpoint: DELETE /users/:id
   *
   * Path Parameters:
   * - id: User UUID
   *
   * Cơ chế Soft Delete:
   * - Chỉ set field isActive = false
   * - Data vẫn được giữ nguyên trong database
   * - User không thể đăng nhập sau khi bị xóa
   * - User sẽ không hiện trong GET /users (vì filter isActive=true)
   * - Có thể restore user bằng cách set lại isActive = true
   *
   * Returns: Success message với user ID
   *
   * Errors:
   * - 400 Bad Request: Invalid UUID
   * - 404 Not Found: User không tồn tại
   *
   * Lưu ý: Đây KHÔNG phải hard delete (xóa vĩnh viễn)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK) // Return 200 thay vì 204 vì có response body
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, type: NotFoundErrorResponseDto })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully', id };
  }
}
