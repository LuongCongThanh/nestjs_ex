/**
 * Users Module - Quản lý module Users
 *
 * Module này bao gồm:
 * - UsersController: Xử lý REST API endpoints
 * - UsersService: Business logic
 * - User Entity: Database model (imported qua TypeORM)
 *
 * Exports:
 * - UsersService: Export để các module khác có thể sử dụng
 *   Ví dụ: AuthModule cần UsersService.findByEmail() để authentication
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Đăng ký User entity để có thể inject Repository<User>
  ],
  controllers: [UsersController], // Đăng ký controller
  providers: [UsersService], // Đăng ký service
  exports: [UsersService], // Export UsersService để dùng ở modules khác (e.g., AuthModule)
})
export class UsersModule {}
