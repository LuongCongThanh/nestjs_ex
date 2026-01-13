# 📘 Auth Module – Standardized Specification & Implementation Guide

**Version:** 1.1 (Standardized)  
**Last Updated:** January 13, 2026  
**Status:** Production-Ready Specification  
**Maintained By:** Development Team

This document is a synthesized and standardized version of the original Auth Module specification. It focuses on clarity, completeness, and adherence to NestJS best practices using TypeScript. All components are defined with step-by-step implementation, including code snippets for entities, services, controllers, DTOs (request/response), and sample data. Security principles (e.g., bcrypt hashing, JWT with separate secrets, token rotation, generic errors) are enforced throughout.

---

## 0️⃣ Tổng Quan Về Module Auth

### 🎯 Mục Đích

Module Auth xử lý toàn bộ các vấn đề về xác thực và ủy quyền cho API e-commerce:

- Đăng ký người dùng với xác thực email bắt buộc qua link.
- Đăng nhập (yêu cầu email đã xác thực).
- Quản lý session (JWT-based với access và refresh tokens).
- Quản lý mật khẩu (quên/reset/thay đổi).
- Xác thực email qua link (bắt buộc để kích hoạt tài khoản).
- Role-based access control (RBAC: USER, ADMIN, SELLER).
- Các tính năng bảo mật: blacklist tokens, rate limiting, token rotation.
- Tích hợp OAuth (tùy chọn).

### 🧱 Kiến Trúc Tổng Quan

```
┌─────────────────────────────┐
│ CLIENT (Web/Mobile)         │
└─────────────┬───────────────┘
              │ HTTP + JWT
              ▼
┌─────────────────────────────┐
│ CONTROLLER (Routes, Guards) │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ SERVICE (Business Logic)    │
└─────────────┬───────────────┘
              │
              ▼
┌─────────────────────────────┐
│ REPOSITORY (TypeORM, DB)    │
└─────────────────────────────┘
```

- **Nguyên Tắc Chính**: Security first (bcrypt, JWT rotation, generic errors); Stateless auth cho access tokens; Stateful cho refresh tokens (lưu DB để revoke).

### 🔑 Nguyên Tắc Thiết Kế

- **Bảo Mật**: Bcrypt hashing (salt ≥10), separate secrets cho access/refresh JWT, token rotation, rate limiting.
- **Stateless/Stateful**: Access tokens stateless; Refresh tokens lưu DB để revoke.
- **Generic Errors**: Không leak info (e.g., "Invalid credentials" cho cả email sai/mật khẩu sai).
- **Guards/Decorators**: `@UseGuards(JwtAuthGuard)`, `@Roles()`, `@Public()`.

---

## 1️⃣ Thứ Tự Ưu Tiên Thực Hiện Các API

Thực hiện theo thứ tự **nghiêm ngặt**: Không chuyển sang priority tiếp theo nếu priority hiện tại chưa hoàn thành 100% (code + tests + docs).

### 🔴 P0 – CRITICAL (Core Authentication) – 15-21 hours (~2-3 days)

Phải có để hệ thống auth cơ bản hoạt động. Bắt đầu từ đây.

1. **POST /auth/register**: Tạo tài khoản mới, gửi link xác thực email (không trả JWT ngay).
2. **POST /auth/login**: Xác thực người dùng (yêu cầu email verified).
3. **POST /auth/refresh**: Làm mới access token (với token rotation).
4. **POST /auth/logout**: Đăng xuất thiết bị hiện tại (revoke + blacklist).
5. **POST /auth/logout/all**: Đăng xuất tất cả thiết bị (revoke all).

### 🟡 P1 – HIGH (Email Verification & Password Management) – 14-19 hours (~2-3 days)

Cần thiết cho bảo mật và UX (xác thực email bắt buộc sau register).  
6. **GET /auth/verify-email**: Xác thực email qua link.  
7. **POST /auth/resend-verification-link**: Gửi lại link xác thực.  
8. **POST /auth/forgot-password**: Yêu cầu reset password qua email.  
9. **POST /auth/reset-password**: Reset password qua token.  
10. **POST /auth/change-password**: Thay đổi password (authenticated).

### 🟢 P2 – MEDIUM (Advanced Features) – 5-7 hours (~1 day)

Tăng UX (quản lý sessions).  
11. **GET /auth/sessions**: Liệt kê sessions hoạt động.  
12. **DELETE /auth/sessions/:id**: Revoke session cụ thể.

### 🔵 P3 – OPTIONAL (OAuth) – 5-7 hours (~1 day)

Tích hợp sau nếu cần.  
13. **GET /auth/google**: Khởi tạo Google OAuth.  
14. **GET /auth/google/callback**: Xử lý callback từ Google.

**Tổng Thời Gian**: 39-54 hours (~5-7 days).

---

## 6️⃣ Chi Tiết Triển Khai Từng API

Đối với mỗi API, tôi định nghĩa rõ ràng:

- **Mô Tả & Chức Năng Đầy Đủ**: Mục đích, bảo mật, yêu cầu.
- **Bước 1: Tạo Entity** (nếu cần, với TypeORM).
- **Bước 2: Tạo Service** (business logic).
- **Bước 3: Tạo Controller** (route handling).
- **Request Data Mẫu** (DTO cho input).
- **Response Data Mẫu** (DTO cho output).

Giả sử bạn đã có `User` entity (từ schema gốc). Sử dụng các module phụ: JwtModule, TypeOrmModule, ConfigModule.

### 🔴 P0 API #1: POST /auth/register

**Mô Tả**: Tạo user mới, hash password, gửi link xác thực email (không trả JWT). Yêu cầu: Email unique, password strong (≥8 chars, upper/lower/number/special). Bảo mật: Hash SHA-256 cho verification token, invalidate old tokens.

**Bước 1: Tạo Entity** (EmailVerificationToken – nếu chưa có).

```ts
// src/modules/auth/entities/email-verification-token.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string; // Hashed

  @ManyToOne(() => User, (user) => user.emailVerificationTokens, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ default: false })
  isUsed: boolean;

  @Column()
  expiresAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

**Bước 2: Tạo Service**.

```ts
// src/modules/auth/services/auth.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service'; // Giả sử có email service

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(EmailVerificationToken) private verificationRepo: Repository<EmailVerificationToken>,
    private config: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existingUser) throw new ConflictException({ message: 'Email already exists', errorCode: 'AUTH_EMAIL_EXISTS' });

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: 'USER',
      emailVerified: false,
    });
    await this.userRepo.save(user);

    // Invalidate old verification tokens
    await this.verificationRepo.update({ userId: user.id, isUsed: false }, { expiresAt: new Date() });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const verificationToken = this.verificationRepo.create({
      token: hashedToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      isUsed: false,
    });
    await this.verificationRepo.save(verificationToken);

    // Send email (async)
    const url = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;
    await this.emailService.sendVerificationEmail(user.email, user.firstName, url);

    return { message: 'Registration successful. Please check your email to verify.' };
  }
}
```

**Bước 3: Tạo Controller**.

```ts
// src/modules/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Public()
  @Throttle(5, 60) // 5 req/min
  @HttpCode(201)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
}
```

**Request Data Mẫu** (RegisterDto).

```ts
// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  password: string;

  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;
}
```

**Response Data Mẫu**.

```json
{
  "statusCode": 201,
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": null
}
```

### 🔴 P0 API #2: POST /auth/login

**Mô Tả**: Xác thực user, kiểm tra email verified, trả JWT tokens. Bảo mật: Generic error, update last_login_at, lưu refresh token với device info.

**Bước 1: Tạo Entity** (RefreshToken – nếu chưa có).

```ts
// src/modules/auth/entities/refresh-token.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  deviceInfo: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ default: false })
  isRevoked: boolean;

  @Column()
  expiresAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

**Bước 2: Tạo Service**.

```ts
// auth.service.ts (thêm method)
async login(dto: LoginDto) {
  const user = await this.userRepo.findOne({ where: { email: dto.email }, select: ['id', 'email', 'password', 'role', 'emailVerified', 'isActive'] });
  if (!user || !await bcrypt.compare(dto.password, user.password) || !user.isActive || !user.emailVerified) {
    throw new UnauthorizedException({ message: 'Invalid credentials', errorCode: 'AUTH_INVALID_CREDENTIALS' });
  }

  await this.userRepo.update(user.id, { lastLoginAt: new Date() });

  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = this.jwtService.sign(payload, { secret: this.config.get('JWT_SECRET'), expiresIn: '15m' });
  const refreshToken = this.refreshJwtService.sign({ sub: user.id, type: 'refresh' }, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' });

  const refreshEntity = this.refreshRepo.create({
    token: refreshToken,
    userId: user.id,
    deviceInfo: req.headers['user-agent'], // Từ request
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  await this.refreshRepo.save(refreshEntity);

  return { accessToken, refreshToken, user: { id: user.id, email: user.email, role: user.role } };
}
```

**Bước 3: Tạo Controller**.

```ts
// auth.controller.ts
@Post('login')
@Public()
@Throttle(5, 60)
@HttpCode(200)
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto);
}
```

**Request Data Mẫu** (LoginDto).

```ts
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}
```

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { "id": "uuid", "email": "user@example.com", "role": "USER" }
  }
}
```

### 🔴 P0 API #3: POST /auth/refresh

**Mô Tả**: Làm mới access token, enforce token rotation (xoá refresh cũ). Bảo mật: Validate signature, not revoked, not expired.

**Bước 1: Entity**: Sử dụng RefreshToken từ trên.

**Bước 2: Tạo Service** (RefreshTokenService riêng).

```ts
// src/modules/auth/services/refresh-token.service.ts
@Injectable()
export class RefreshTokenService {
  constructor(@InjectRepository(RefreshToken) private repo: Repository<RefreshToken>) {}

  async validateAndRotate(oldToken: string, userId: string, deviceInfo: string, ip: string) {
    const old = await this.repo.findOne({ where: { token: oldToken } });
    if (!old || old.isRevoked || old.expiresAt < new Date()) throw new UnauthorizedException('Invalid refresh token');

    // Rotate: Revoke old
    await this.repo.update(old.id, { isRevoked: true });

    // Create new
    const newToken = this.refreshJwtService.sign({ sub: userId, type: 'refresh' }, { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' });
    const newEntity = this.repo.create({
      token: newToken,
      userId,
      deviceInfo,
      ipAddress: ip,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.repo.save(newEntity);

    return newToken;
  }
}

// Trong auth.service.ts
async refresh(dto: RefreshDto, req) {
  // Validate JWT signature (qua guard)
  const newRefresh = await this.refreshService.validateAndRotate(dto.refreshToken, req.user.id, req.headers['user-agent'], req.ip);
  const accessToken = this.jwtService.sign({ sub: req.user.id, email: req.user.email, role: req.user.role }, { secret: this.config.get('JWT_SECRET'), expiresIn: '15m' });
  return { accessToken, refreshToken: newRefresh };
}
```

**Bước 3: Tạo Controller**.

```ts
@Post('refresh')
@UseGuards(RefreshGuard) // Guard validate refresh token
@Throttle(10, 60)
@HttpCode(200)
async refresh(@Body() dto: RefreshDto, @Req() req) {
  return this.authService.refresh(dto, req);
}
```

**Request Data Mẫu** (RefreshDto).

```ts
export class RefreshDto {
  @IsNotEmpty()
  refreshToken: string;
}
```

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "new-access-token...",
    "refreshToken": "new-refresh-token..."
  }
}
```

### 🔴 P0 API #4: POST /auth/logout

**Mô Tả**: Revoke refresh token hiện tại, blacklist access token. Bảo mật: Lưu blacklist với reason 'LOGOUT'.

**Bước 1: Tạo Entity** (TokenBlacklist – nếu chưa có).

```ts
// src/modules/auth/entities/token-blacklist.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from 'src/entities/user.entity';

@Entity('token_blacklist')
export class TokenBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string;

  @ManyToOne(() => User, (user) => user.tokenBlacklists, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  reason: string; // e.g., 'LOGOUT'

  @Column()
  expiresAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

**Bước 2: Tạo Service** (TokenBlacklistService).

```ts
// src/modules/auth/services/token-blacklist.service.ts
@Injectable()
export class TokenBlacklistService {
  constructor(@InjectRepository(TokenBlacklist) private repo: Repository<TokenBlacklist>) {}

  async add(token: string, userId: string, reason: string, expiresAt: Date) {
    const entity = this.repo.create({ token, userId, reason, expiresAt });
    await this.repo.save(entity);
  }
}

// Trong auth.service.ts
async logout(req) {
  const accessToken = req.headers.authorization.split(' ')[1];
  const refreshToken = req.body.refreshToken; // Hoặc từ header

  await this.refreshService.revokeByToken(refreshToken);
  await this.blacklistService.add(accessToken, req.user.id, 'LOGOUT', new Date(Date.now() + 15 * 60 * 1000)); // Match access exp

  return { message: 'Logged out successfully' };
}
```

**Bước 3: Tạo Controller**.

```ts
@Post('logout')
@UseGuards(JwtAuthGuard)
@Throttle(10, 60)
@HttpCode(200)
async logout(@Req() req, @Body() dto: LogoutDto) {
  return this.authService.logout(req);
}
```

**Request Data Mẫu** (LogoutDto – optional, nếu cần refreshToken).

```ts
export class LogoutDto {
  refreshToken?: string;
}
```

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

### 🔴 P0 API #5: POST /auth/logout/all

**Mô Tả**: Revoke tất cả refresh tokens của user, blacklist access hiện tại.

**Bước 1: Entity**: Sử dụng RefreshToken và TokenBlacklist.

**Bước 2: Tạo Service**.

```ts
// refresh-token.service.ts (thêm method)
async revokeAllForUser(userId: string) {
  await this.repo.update({ userId, isRevoked: false }, { isRevoked: true });
}

// Trong auth.service.ts
async logoutAll(req) {
  await this.refreshService.revokeAllForUser(req.user.id);
  const accessToken = req.headers.authorization.split(' ')[1];
  await this.blacklistService.add(accessToken, req.user.id, 'LOGOUT_ALL', new Date(Date.now() + 15 * 60 * 1000));

  return { message: 'Logged out from all devices' };
}
```

**Bước 3: Tạo Controller**.

```ts
@Post('logout/all')
@UseGuards(JwtAuthGuard)
@Throttle(5, 60)
@HttpCode(200)
async logoutAll(@Req() req) {
  return this.authService.logoutAll(req);
}
```

**Request Data Mẫu**: Không cần body.

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Logged out from all devices",
  "data": null
}
```

### 🟡 P1 API #6: GET /auth/verify-email

**Mô Tả**: Xác thực email qua token từ link. Bảo mật: Hash token, single-use, expire 24h.

**Bước 1: Entity**: Sử dụng EmailVerificationToken từ API #1.

**Bước 2: Tạo Service**.

```ts
// auth.service.ts
async verifyEmail(token: string) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const verification = await this.verificationRepo.findOne({ where: { token: hashed }, relations: ['user'] });
  if (!verification || verification.isUsed || verification.expiresAt < new Date() || verification.user.emailVerified) {
    throw new BadRequestException({ message: 'Invalid or expired token', errorCode: 'AUTH_VERIFICATION_TOKEN_INVALID' });
  }

  await this.userRepo.update(verification.userId, { emailVerified: true });
  await this.verificationRepo.update(verification.id, { isUsed: true });

  return { message: 'Email verified successfully' };
}
```

**Bước 3: Tạo Controller**.

```ts
@Get('verify-email')
@Public()
@Throttle(10, 3600)
@HttpCode(200)
async verifyEmail(@Query('token') token: string) {
  return this.authService.verifyEmail(token);
}
```

**Request Data Mẫu**: Query param: `?token=hex-string-64-chars`.

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Email verified successfully",
  "data": { "emailVerified": true }
}
```

### 🟡 P1 API #7: POST /auth/resend-verification-link

**Mô Tả**: Gửi lại link xác thực (generic response).

**Bước 1: Entity**: Sử dụng EmailVerificationToken.

**Bước 2: Tạo Service**.

```ts
// auth.service.ts
async resendVerification(dto: ResendDto) {
  const user = await this.userRepo.findOne({ where: { email: dto.email } });
  if (!user) return { message: 'If registered, verification link sent' }; // Generic

  if (user.emailVerified) throw new BadRequestException('Email already verified');

  // Invalidate old
  await this.verificationRepo.update({ userId: user.id, isUsed: false }, { expiresAt: new Date() });

  // Generate new
  const token = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  await this.verificationRepo.save({ token: hashed, userId: user.id, expiresAt: new Date(Date.now() + 24*60*60*1000) });

  const url = `${this.config.get('FRONTEND_URL')}/verify-email?token=${token}`;
  await this.emailService.sendVerificationEmail(user.email, user.firstName, url);

  return { message: 'If registered, verification link sent' };
}
```

**Bước 3: Tạo Controller**.

```ts
@Post('resend-verification-link')
@Public()
@Throttle(3, 3600)
@HttpCode(200)
async resend(@Body() dto: ResendDto) {
  return this.authService.resendVerification(dto);
}
```

**Request Data Mẫu** (ResendDto).

```ts
export class ResendDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "If your email is registered, you will receive a verification link",
  "data": null
}
```

### 🟡 P1 API #8: POST /auth/forgot-password

**Mô Tả**: Yêu cầu reset password qua email (generic).

**Bước 1: Tạo Entity** (PasswordResetToken).

```ts
// src/modules/auth/entities/password-reset-token.entity.ts
@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token: string; // Hashed

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  usedAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
```

**Bước 2: Tạo Service**.

```ts
// auth.service.ts
async forgotPassword(dto: ForgotDto) {
  const user = await this.userRepo.findOne({ where: { email: dto.email } });
  if (!user) return { message: 'If registered, reset link sent' };

  await this.resetRepo.update({ userId: user.id, usedAt: null }, { expiresAt: new Date() });

  const token = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  await this.resetRepo.save({ token: hashed, userId: user.id, expiresAt: new Date(Date.now() + 15*60*1000) });

  const url = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;
  await this.emailService.sendResetEmail(user.email, user.firstName, url);

  return { message: 'If registered, reset link sent' };
}
```

**Bước 3: Tạo Controller**.

```ts
@Post('forgot-password')
@Public()
@Throttle(3, 3600)
@HttpCode(200)
async forgotPassword(@Body() dto: ForgotDto) {
  return this.authService.forgotPassword(dto);
}
```

**Request Data Mẫu** (ForgotDto).

```ts
export class ForgotDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "If your email is registered, you will receive a password reset link",
  "data": null
}
```

### 🟡 P1 API #9: POST /auth/reset-password

**Mô Tả**: Reset password qua token, revoke all sessions.

**Bước 1: Entity**: Sử dụng PasswordResetToken.

**Bước 2: Tạo Service**.

```ts
// auth.service.ts
async resetPassword(dto: ResetDto) {
  const hashed = crypto.createHash('sha256').update(dto.token).digest('hex');
  const reset = await this.resetRepo.findOne({ where: { token: hashed }, relations: ['user'] });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) throw new BadRequestException('Invalid or expired reset token');

  const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
  await this.userRepo.update(reset.userId, { password: hashedPassword });

  await this.resetRepo.update(reset.id, { usedAt: new Date() });
  await this.refreshService.revokeAllForUser(reset.userId); // Security

  return { message: 'Password reset successfully' };
}
```

**Bước 3: Tạo Controller**.

```ts
@Post('reset-password')
@Public()
@Throttle(5, 3600)
@HttpCode(200)
async resetPassword(@Body() dto: ResetDto) {
  return this.authService.resetPassword(dto);
}
```

**Request Data Mẫu** (ResetDto).

```ts
export class ResetDto {
  @IsNotEmpty()
  @Length(64, 64)
  token: string;

  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  newPassword: string;
}
```

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password reset successfully",
  "data": null
}
```

### 🟡 P1 API #10: POST /auth/change-password

**Mô Tả**: Thay đổi password (check old password), issue new tokens, revoke old sessions.

**Bước 1: Entity**: Không cần mới.

**Bước 2: Tạo Service**.

```ts
// auth.service.ts
async changePassword(dto: ChangeDto, userId: string) {
  const user = await this.userRepo.findOne({ where: { id: userId }, select: ['password'] });
  if (!await bcrypt.compare(dto.oldPassword, user.password)) throw new BadRequestException('Old password incorrect');

  if (await bcrypt.compare(dto.newPassword, user.password)) throw new BadRequestException('New password must be different');

  const hashed = await bcrypt.hash(dto.newPassword, 10);
  await this.userRepo.update(userId, { password: hashed });

  await this.refreshService.revokeAllForUser(userId);

  // Issue new tokens (tương tự login)
  const payload = { sub: userId, /*...*/ };
  const accessToken = this.jwtService.sign(payload, { /*...*/ });
  const refreshToken = /* generate and save new refresh */;

  return { accessToken, refreshToken };
}
```

**Bước 3: Tạo Controller**.

```ts
@Post('change-password')
@UseGuards(JwtAuthGuard)
@Throttle(10, 3600)
@HttpCode(200)
async changePassword(@Body() dto: ChangeDto, @GetUser() user) {
  return this.authService.changePassword(dto, user.id);
}
```

**Request Data Mẫu** (ChangeDto).

```ts
export class ChangeDto {
  @IsNotEmpty()
  oldPassword: string;

  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  newPassword: string;
}
```

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Password changed successfully",
  "data": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### 🟢 P2 API #11: GET /auth/sessions

**Mô Tả**: Liệt kê sessions hoạt động (devices).

**Bước 1: Entity**: Sử dụng RefreshToken.

**Bước 2: Tạo Service**.

```ts
// refresh-token.service.ts
async getActiveSessions(userId: string) {
  return this.repo.find({ where: { userId, isRevoked: false, expiresAt: { $gt: new Date() } }, select: ['id', 'deviceInfo', 'ipAddress', 'createdAt'] });
}

// auth.service.ts
async getSessions(userId: string) {
  return this.refreshService.getActiveSessions(userId);
}
```

**Bước 3: Tạo Controller**.

```ts
@Get('sessions')
@UseGuards(JwtAuthGuard)
@HttpCode(200)
async getSessions(@GetUser() user) {
  return this.authService.getSessions(user.id);
}
```

**Request Data Mẫu**: Không cần.

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Sessions retrieved",
  "data": [
    { "id": "uuid", "deviceInfo": "Mozilla/5.0...", "ipAddress": "192.168.1.1", "createdAt": "2026-01-13T00:00:00Z" }
  ]
}
```

### 🟢 P2 API #12: DELETE /auth/sessions/:id

**Mô Tả**: Revoke session cụ thể.

**Bước 1: Entity**: Sử dụng RefreshToken.

**Bước 2: Tạo Service**.

```ts
// refresh-token.service.ts
async revokeSession(id: string, userId: string) {
  const session = await this.repo.findOne({ where: { id, userId } });
  if (!session) throw new NotFoundException('Session not found');
  await this.repo.update(id, { isRevoked: true });
}
```

**Bước 3: Tạo Controller**.

```ts
@Delete('sessions/:id')
@UseGuards(JwtAuthGuard)
@HttpCode(200)
async revokeSession(@Param('id') id: string, @GetUser() user) {
  await this.refreshService.revokeSession(id, user.id);
  return { message: 'Session revoked' };
}
```

**Request Data Mẫu**: Param `:id`.

**Response Data Mẫu**.

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Session revoked",
  "data": null
}
```

### 🔵 P3 API #13: GET /auth/google

**Mô Tả**: Khởi tạo Google OAuth flow.

**Bước 1: Entity**: Không cần mới (sử dụng User, password nullable cho OAuth).

**Bước 2: Tạo Service** (GoogleStrategy).

```ts
// src/modules/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get('GOOGLE_CLIENT_ID'),
      clientSecret: config.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${config.get('API_URL')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken, refreshToken, profile) {
    const { emails, name } = profile;
    let user = await this.authService.findByEmail(emails[0].value);
    if (!user) {
      user = await this.authService.createOAuthUser(emails[0].value, name.givenName, name.familyName);
    }
    return user;
  }
}
```

**Bước 3: Tạo Controller**.

```ts
@Get('google')
@Public()
@UseGuards(AuthGuard('google'))
async googleAuth() {} // Passport handles redirect
```

**Request Data Mẫu**: Không cần.

**Response Data Mẫu**: Redirect đến Google OAuth page.

### 🔵 P3 API #14: GET /auth/google/callback

**Mô Tả**: Xử lý callback, tạo/login user, trả tokens.

**Bước 1: Entity**: Không cần.

**Bước 2: Tạo Service**: Sử dụng từ #13 (validate method xử lý create/login).

**Bước 3: Tạo Controller**.

```ts
@Get('google/callback')
@Public()
@UseGuards(AuthGuard('google'))
async googleCallback(@Req() req) {
  // Generate tokens from req.user (tương tự login)
  return this.authService.generateTokens(req.user);
}
```

**Request Data Mẫu**: Query từ Google (code, state).

**Response Data Mẫu**: Tương tự login response (tokens + user).

---

## 🎉 Kết Luận

Tài liệu này đã được tổng hợp và chuẩn hóa, tập trung vào triển khai NestJS/TypeScript đầy đủ. Bắt đầu từ P0, đảm bảo tests (unit/e2e) cho mỗi API. Nếu cần code đầy đủ hơn (e.g., guards, modules), hãy cho biết!
