# 📘 AUTH MODULE – ULTRA-DETAILED SPECIFICATION

**Version:** 3.2 (Restored & Optimized)  
**Target:** E-commerce Projects (Vietnam 2026)  
**Architecture:** Stateless Verification/Reset (JWT) + Stateful Sessions (DB)

---

## 📋 TABLE OF CONTENTS

1. [Overview & Architecture](#1-overview--architecture)
2. [Database Schema](#2-database-schema)
3. [DTOs & Validation (with Swagger)](#3-dtos--validation)
4. [API Endpoints (Full Detail)](#4-api-endpoints-full-detail)
5. [Service Implementation](#5-service-implementation)
6. [Controller Implementation (with Swagger)](#6-controller-implementation)
7. [Email Templates](#7-email-templates)
8. [Error Handling](#8-error-handling)
9. [Security & Edge Cases](#9-security--edge-cases)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. OVERVIEW & ARCHITECTURE

### 🎯 Module Purpose
Authentication module for e-commerce platform with:
- ✅ **Stateless Email Verification** (JWT-based)
- ✅ **Stateless Password Reset** (JWT-based)
- ✅ JWT-based authentication (Access + Refresh tokens)
- ✅ Token rotation (DB-backed refresh tokens for security)

### 🏗️ Folder Structure
```
src/modules/auth/
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   └── change-password.dto.ts
├── entities/
│   └── refresh-token.entity.ts  <-- Sole auth entity
├── services/
│   ├── auth.service.ts
│   └── token.service.ts
├── controllers/
│   └── auth.controller.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── strategies/
│   └── jwt.strategy.ts
└── auth.module.ts
```

---

## 2. DATABASE SCHEMA

### 2.1 `users` Table (Partial - Auth Fields)
```typescript
// src/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  @Exclude() // CRITICAL: Never expose password in responses
  password: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ default: 'USER', length: 20 })
  role: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### 2.2 `refresh_tokens` Table
```typescript
// src/modules/auth/entities/refresh-token.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../../entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 500 })
  token: string; // Hashed refresh token

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'user_agent', nullable: true, length: 255 })
  userAgent: string;

  @Column({ name: 'ip_address', nullable: true, length: 45 })
  ipAddress: string;
}
```

---

## 3. DTOs & VALIDATION (FULL CODE)

### 3.1 Register DTO
```typescript
// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address (will be converted to lowercase)',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Mật khẩu (min 8 ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt)',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  password: string;

  @ApiProperty({ example: 'Thanh', description: 'Họ' })
  @IsString()
  @IsNotEmpty({ message: 'Họ không được để trống' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({ example: 'Luong', description: 'Tên' })
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @Transform(({ value }) => value?.trim())
  lastName: string;
}
```

### 3.2 Login DTO
```typescript
// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
```

### 3.3 Refresh Token DTO
```typescript
// src/modules/auth/dto/refresh-token.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ example: '7c8d9e...' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refreshToken: string;
}
```

### 3.4 Forgot Password DTO
```typescript
// src/modules/auth/dto/forgot-password.dto.ts
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}
```

### 3.5 Reset Password DTO
```typescript
// src/modules/auth/dto/reset-password.dto.ts
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'jwt-token-string' })
  @IsString()
  @IsNotEmpty({ message: 'Token không được để trống' })
  token: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  newPassword: string;
}
```

### 3.6 Change Password DTO
```typescript
// src/modules/auth/dto/change-password.dto.ts
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  newPassword: string;
}
```

---

## 4. API ENDPOINTS

### 4.1 POST /auth/register
- **Flow**: Create User → Sign JWT (1d) → Send Email
- **Stateless**: Token is NOT saved in DB.

### 4.2 GET /auth/verify-email
- **Flow**: Verify JWT Signature → Update `emailVerified=true`
- **Stateless**: Validates via CPU.

### 4.3 POST /auth/forgot-password
- **Flow**: Find User → Sign JWT (15m) → Send Email
- **Stateless**: Token is NOT saved in DB.

### 4.4 POST /auth/reset-password
- **Flow**: Verify JWT → Update Password → Revoke Sessions (DB)
- **Logic**: Even though reset token is stateless, we still clear `refresh_tokens` table to force security.

### 4.5 POST /auth/login & /auth/refresh
- **Stateful**: Uses `refresh_tokens` table to allow revocation.

---

## 5. SERVICE IMPLEMENTATION

### 5.1 Token Service (Helper)
```typescript
// src/modules/auth/services/token.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  generateRefreshToken(payload: any): string {
    return crypto.randomBytes(64).toString('hex');
  }

  generateStatelessToken(payload: any, type: 'verify' | 'reset'): string {
    const secret = type === 'verify' 
      ? this.configService.get('JWT_VERIFICATION_SECRET')
      : this.configService.get('JWT_RESET_SECRET');
    
    const expiresIn = type === 'verify' ? '1d' : '15m';

    return this.jwtService.sign(payload, { secret, expiresIn });
  }

  verifyStatelessToken(token: string, type: 'verify' | 'reset'): any {
    const secret = type === 'verify' 
      ? this.configService.get('JWT_VERIFICATION_SECRET')
      : this.configService.get('JWT_RESET_SECRET');
      
    try {
      return this.jwtService.verify(token, { secret });
    } catch (e) {
      throw new Error('Invalid token');
    }
  }
}
```

### 5.2 Auth Service (Stateless Logic)
```typescript
// Partial logic for verifyEmail
async verifyEmail(token: string) {
  try {
    const payload = this.tokenService.verifyStatelessToken(token, 'verify');
    if (payload.type !== 'verify_email') throw new Error();

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) throw new BadRequestException('User not found');
    if (user.emailVerified) throw new BadRequestException('Email already verified');

    user.emailVerified = true;
    await this.userRepository.save(user);

    return { success: true, message: 'Email verified' };
  } catch (e) {
    throw new BadRequestException('Invalid or expired verification link');
  }
}
```

---

## 6. CONTROLLER IMPLEMENTATION

```typescript
// src/modules/auth/controllers/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 req/hour
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xác thực email (Link từ email)' })
  @ApiResponse({ status: 200, description: 'Xác thực thành công' })
  @ApiResponse({ status: 400, description: 'Token xác thực không hợp lệ' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 req/5min
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @ApiResponse({ status: 200, description: 'Trả về accessToken & refreshToken' })
  @ApiResponse({ status: 401, description: 'Sai tài khoản hoặc mật khẩu' })
  @ApiResponse({ status: 403, description: 'Email chưa được xác thực' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    return this.authService.login(dto, userAgent, ipAddress);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Làm mới Access Token' })
  @ApiResponse({ status: 200, description: 'Cấp token mới thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ/hết hạn' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.ip || '';
    return this.authService.refresh(dto, userAgent, ipAddress);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đăng xuất (Thu hồi Refresh Token)' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 req/hour
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu' })
  @ApiResponse({ status: 200, description: 'Gửi email thành công (nếu tồn tại)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Đặt lại mật khẩu mới' })
  @ApiResponse({ status: 200, description: 'Cập nhật mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Token không hợp lệ hoặc hết hạn' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu (Đã đăng nhập)' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 401, description: 'Mật khẩu cũ không đúng' })
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
```

---

## 7. EMAIL TEMPLATES

### 7.1 Verification Email
```html
<!DOCTYPE html>
<html>
<body>
  <h2>Hello {{name}},</h2>
  <p>Please verify your email using the link below (Link expires in 24h):</p>
  <a href="{{verifyUrl}}">Verify Email</a>
</body>
</html>
```

### 7.2 Reset Password Email
```html
<!DOCTYPE html>
<html>
<body>
  <h2>Hello {{name}},</h2>
  <p>You requested a password reset. Click the link below (Expires in 15 minutes):</p>
  <a href="{{resetUrl}}">Reset Password</a>
  <p>If you did not request this, please ignore this email.</p>
</body>
</html>
```

---

## 8. ERROR HANDLING

### Custom Filter
Returns consistent JSON format:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [...]
}
```

---

## 9. SECURITY & EDGE CASES

- [x] **Rate Limit**: Applied via `@Throttle`.
- [x] **Password**: Bcrypt (12 rounds) + `@Exclude()`.
- [x] **Tokens**: Refresh tokens hashed in DB. Verification tokens stateless (JWT).
- [x] **Generic Errors**: "Email or password incorrect" (Login).

---

## 10. TESTING STRATEGY
*(Standard Unit & E2E)*
