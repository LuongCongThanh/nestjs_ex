# 📚 GIẢI THÍCH CHI TIẾT MODULE AUTH

## 🎯 TỔNG QUAN

Module Authentication xử lý tất cả logic liên quan đến:

- **Đăng ký** (Register) - Tạo tài khoản mới
- **Đăng nhập** (Login) - Xác thực người dùng
- **Bảo vệ routes** (Authentication) - Chỉ cho user đã login truy cập
- **Phân quyền** (Authorization) - Kiểm tra user có quyền truy cập không
- **Token Management** - Quản lý JWT tokens và blacklist

---

## 📁 CẤU TRÚC THƯ MỤC

```
auth/
├── auth.module.ts              ← Cấu hình module, import dependencies
├── auth.controller.ts          ← API endpoints (POST /auth/register, /auth/login)
├── auth.service.ts             ← Business logic (register, login, validateUser)
├── token-blacklist.service.ts  ← Quản lý token bị thu hồi
│
├── dto/                        ← Data Transfer Objects (validation)
│   ├── register.dto.ts         ← Validate dữ liệu đăng ký
│   ├── login.dto.ts            ← Validate dữ liệu đăng nhập
│   └── auth-response.dto.ts    ← Format response trả về
│
├── guards/                     ← Bảo vệ routes
│   ├── jwt-auth.guard.ts       ← Kiểm tra user có token hợp lệ không
│   └── roles.guard.ts          ← Kiểm tra user có role phù hợp không
│
├── decorators/                 ← Custom decorators
│   ├── public.decorator.ts     ← Đánh dấu route là public (không cần token)
│   ├── roles.decorator.ts      ← Định nghĩa roles cần thiết cho route
│   └── get-user.decorator.ts   ← Lấy user info từ request
│
├── strategies/                 ← Passport strategies
│   ├── jwt.strategy.ts         ← Xử lý JWT token validation
│   ├── google.strategy.ts      ← Google OAuth login
│   └── refresh.strategy.ts     ← Refresh token strategy
│
├── entities/                   ← Database entities
│   └── token-blacklist.entity.ts ← Bảng lưu tokens bị thu hồi
│
├── interfaces/                 ← TypeScript interfaces
│   └── jwt-payload.interface.ts  ← Cấu trúc dữ liệu trong JWT token
│
└── docs/                       ← API documentation
    └── auth.responses.ts       ← Swagger response examples
```

---

## 🔄 FLOW HOẠT ĐỘNG CHI TIẾT

### 1️⃣ ĐĂNG KÝ USER MỚI (Register)

```
CLIENT                    CONTROLLER              SERVICE                 DATABASE
  │                          │                       │                       │
  │  POST /auth/register     │                       │                       │
  ├─────────────────────────→│                       │                       │
  │  {                        │                       │                       │
  │    email: "user@test.com"│                       │                       │
  │    password: "Pass@123"   │                       │                       │
  │    firstName: "John"      │                       │                       │
  │    lastName: "Doe"        │                       │                       │
  │  }                        │                       │                       │
  │                           │                       │                       │
  │                           │  register(dto)        │                       │
  │                           ├──────────────────────→│                       │
  │                           │                       │                       │
  │                           │                       │  Kiểm tra email       │
  │                           │                       │  đã tồn tại?          │
  │                           │                       ├──────────────────────→│
  │                           │                       │←─────────────────────┤
  │                           │                       │  null (chưa tồn tại)  │
  │                           │                       │                       │
  │                           │                       │  Hash password        │
  │                           │                       │  "Pass@123"           │
  │                           │                       │     ↓                 │
  │                           │                       │  "$2a$10$abc..."      │
  │                           │                       │                       │
  │                           │                       │  Lưu user mới         │
  │                           │                       ├──────────────────────→│
  │                           │                       │←─────────────────────┤
  │                           │                       │  User saved           │
  │                           │                       │                       │
  │                           │                       │  Generate JWT token   │
  │                           │                       │  payload: {           │
  │                           │                       │    sub: user.id       │
  │                           │                       │    email: user.email  │
  │                           │                       │    role: user.role    │
  │                           │                       │  }                    │
  │                           │                       │     ↓                 │
  │                           │                       │  "eyJhbGciOiJ..."     │
  │                           │                       │                       │
  │                           │  {                    │                       │
  │                           │    access_token: "...",                       │
  │                           │    user: {...}        │                       │
  │                           │  }                    │                       │
  │                           │←─────────────────────┤                       │
  │                           │                       │                       │
  │  201 Created              │                       │                       │
  │  {                        │                       │                       │
  │    statusCode: 201,       │                       │                       │
  │    success: true,         │                       │                       │
  │    message: "...",        │                       │                       │
  │    data: {                │                       │                       │
  │      access_token: "...", │                       │                       │
  │      user: {...}          │                       │                       │
  │    }                      │                       │                       │
  │  }                        │                       │                       │
  │←──────────────────────────┤                       │                       │
```

### 2️⃣ ĐĂNG NHẬP USER (Login)

```
CLIENT                    CONTROLLER              SERVICE                 DATABASE
  │                          │                       │                       │
  │  POST /auth/login         │                       │                       │
  ├─────────────────────────→│                       │                       │
  │  {                        │                       │                       │
  │    email: "user@test.com"│                       │                       │
  │    password: "Pass@123"   │                       │                       │
  │  }                        │                       │                       │
  │                           │                       │                       │
  │                           │  login(dto)           │                       │
  │                           ├──────────────────────→│                       │
  │                           │                       │                       │
  │                           │                       │  Tìm user theo email  │
  │                           │                       ├──────────────────────→│
  │                           │                       │←─────────────────────┤
  │                           │                       │  User found           │
  │                           │                       │                       │
  │                           │                       │  Verify password      │
  │                           │                       │  compare(             │
  │                           │                       │    "Pass@123",        │
  │                           │                       │    "$2a$10$abc..."    │
  │                           │                       │  ) → true ✓           │
  │                           │                       │                       │
  │                           │                       │  Check isActive?      │
  │                           │                       │  → true ✓             │
  │                           │                       │                       │
  │                           │                       │  Generate JWT token   │
  │                           │                       │     ↓                 │
  │                           │                       │  "eyJhbGciOiJ..."     │
  │                           │                       │                       │
  │                           │  {                    │                       │
  │                           │    access_token: "...",                       │
  │                           │    user: {...}        │                       │
  │                           │  }                    │                       │
  │                           │←─────────────────────┤                       │
  │                           │                       │                       │
  │  200 OK                   │                       │                       │
  │  {                        │                       │                       │
  │    statusCode: 200,       │                       │                       │
  │    success: true,         │                       │                       │
  │    message: "...",        │                       │                       │
  │    data: {                │                       │                       │
  │      access_token: "...", │                       │                       │
  │      user: {...}          │                       │                       │
  │    }                      │                       │                       │
  │  }                        │                       │                       │
  │←──────────────────────────┤                       │                       │
```

### 3️⃣ TRUY CẬP PROTECTED ROUTE

```
CLIENT                GUARD                STRATEGY              SERVICE           DATABASE
  │                     │                      │                     │                 │
  │  GET /users/profile │                      │                     │                 │
  │  Header:            │                      │                     │                 │
  │  Authorization:     │                      │                     │                 │
  │  Bearer eyJhbGci... │                      │                     │                 │
  ├────────────────────→│                      │                     │                 │
  │                     │                      │                     │                 │
  │                     │  JwtAuthGuard        │                     │                 │
  │                     │  canActivate()       │                     │                 │
  │                     │  Check @Public()?    │                     │                 │
  │                     │  → No, need auth     │                     │                 │
  │                     │                      │                     │                 │
  │                     │  Passport validates  │                     │                 │
  │                     ├─────────────────────→│                     │                 │
  │                     │                      │  JwtStrategy        │                 │
  │                     │                      │  validate()         │                 │
  │                     │                      │                     │                 │
  │                     │                      │  1. Extract token   │                 │
  │                     │                      │  2. Verify signature│                 │
  │                     │                      │  3. Decode payload  │                 │
  │                     │                      │     {               │                 │
  │                     │                      │       sub: "user-id"│                 │
  │                     │                      │       email: "..."  │                 │
  │                     │                      │       role: "user"  │                 │
  │                     │                      │     }               │                 │
  │                     │                      │                     │                 │
  │                     │                      │  4. Check blacklist?│                 │
  │                     │                      │                     │                 │
  │                     │                      │  validateUser()     │                 │
  │                     │                      ├────────────────────→│                 │
  │                     │                      │                     │  Find user by id│
  │                     │                      │                     ├────────────────→│
  │                     │                      │                     │←────────────────┤
  │                     │                      │                     │  User found     │
  │                     │                      │  User object        │                 │
  │                     │                      │←────────────────────┤                 │
  │                     │                      │                     │                 │
  │                     │  Valid! Attach user  │                     │                 │
  │                     │  to request.user     │                     │                 │
  │                     │←─────────────────────┤                     │                 │
  │                     │                      │                     │                 │
  │  Continue to        │                      │                     │                 │
  │  Controller         │                      │                     │                 │
  │←────────────────────┤                      │                     │                 │
  │                     │                      │                     │                 │
  │  @GetUser() có thể  │                      │                     │                 │
  │  lấy user từ        │                      │                     │                 │
  │  request.user       │                      │                     │                 │
```

### 4️⃣ KIỂM TRA ROLE (Authorization)

```
CLIENT               JwtAuthGuard         RolesGuard           Controller
  │                      │                    │                    │
  │  GET /admin/users    │                    │                    │
  ├─────────────────────→│                    │                    │
  │                      │                    │                    │
  │                      │  1. Authenticate   │                    │
  │                      │  (như flow trên)   │                    │
  │                      │  → User attached   │                    │
  │                      │  to request.user   │                    │
  │                      │                    │                    │
  │                      │  Pass to next      │                    │
  │                      │  guard             │                    │
  │                      ├───────────────────→│                    │
  │                      │                    │                    │
  │                      │                    │  2. Check role     │
  │                      │                    │  @Roles(ADMIN)     │
  │                      │                    │  decorator         │
  │                      │                    │  requiredRoles =   │
  │                      │                    │  [UserRole.ADMIN]  │
  │                      │                    │                    │
  │                      │                    │  request.user.role │
  │                      │                    │  = "user" ❌       │
  │                      │                    │                    │
  │                      │  403 Forbidden     │                    │
  │←─────────────────────┴────────────────────┤                    │
  │                                                                 │
  │  {                                                              │
  │    statusCode: 403,                                            │
  │    message: "Forbidden resource"                               │
  │  }                                                              │
```

---

## 📦 CHI TIẾT TỪNG FILE

### 1. **auth.module.ts** - Cấu hình Module

```typescript
/**
 * NHIỆM VỤ:
 * - Đăng ký tất cả dependencies (controllers, services, guards, strategies)
 * - Cấu hình JWT với secret key từ environment
 * - Cấu hình Passport với strategy mặc định là JWT
 * - Export các services/guards để modules khác dùng
 */

@Module({
  imports: [
    // Đăng ký repositories để truy cập database
    TypeOrmModule.forFeature([User, TokenBlacklist]),

    // Cấu hình Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Cấu hình JWT động từ .env
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),      // Key để sign/verify token
        signOptions: { expiresIn: '7d' }       // Token hết hạn sau 7 ngày
      })
    })
  ],
  controllers: [AuthController],                // API endpoints
  providers: [AuthService, JwtStrategy, ...],   // Services & strategies
  exports: [AuthService, JwtAuthGuard, ...]     // Cho modules khác dùng
})
```

**KHI NÀO DÙNG:**

- Module được import trong `AppModule`
- Các module khác import `AuthModule` để dùng guards và services

---

### 2. **auth.controller.ts** - API Endpoints

```typescript
/**
 * NHIỆM VỤ:
 * - Định nghĩa HTTP endpoints (/auth/register, /auth/login)
 * - Validate request body với DTOs
 * - Gọi AuthService xử lý logic
 * - Trả response về client
 * - Swagger documentation
 */

@Controller('auth')
export class AuthController {
  // POST /auth/register
  @Post('register')
  @RegisterResponse // Swagger doc - hiển thị example response
  @ConflictResponse // Swagger doc - nếu email đã tồn tại
  async register(@Body() dto: RegisterDto) {
    // @Body() tự động validate dto với class-validator
    // Nếu invalid → throw BadRequestException
    return this.authService.register(dto);
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(200) // Override status code mặc định 201 → 200
  @LoginResponse // Swagger doc
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
```

**REQUEST/RESPONSE:**

```
Request:  POST /auth/register
Body:     { email, password, firstName, lastName, phone }

Response: 201 Created
{
  "statusCode": 201,
  "success": true,
  "message": "User registered successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "user@test.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "createdAt": "2026-01-12T00:00:00.000Z"
    }
  }
}
```

---

### 3. **auth.service.ts** - Business Logic

```typescript
/**
 * NHIỆM VỤ:
 * - Xử lý logic đăng ký, đăng nhập
 * - Hash password với bcrypt
 * - Generate JWT token
 * - Validate user từ JWT payload
 * - Tương tác với database qua Repository
 */

export class AuthService {
  async register(dto: RegisterDto) {
    // 1. Check email tồn tại
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
      select: ['id'], // Chỉ lấy id, không load toàn bộ user
    });
    if (existing) throw new ConflictException('Email exists');

    // 2. Hash password
    const hash = await bcrypt.hash(dto.password, 10);
    // Input:  "Password@123"
    // Output: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

    // 3. Lưu user
    const user = await this.userRepository.save({
      ...dto,
      password: hash,
    });

    // 4. Loại bỏ password khỏi response
    const { password: _, ...clean } = user;

    // 5. Generate JWT
    const token = this.generateToken(user);

    return { access_token: token, user: clean };
  }

  generateToken(user: User): string {
    // Payload là dữ liệu được encode trong token
    const payload = {
      sub: user.id, // "subject" - user id
      email: user.email,
      role: user.role,
    };

    // Sign token với secret key
    return this.jwtService.sign(payload);

    // Kết quả: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwiaWF0IjoxNjg5MDAwMDAwLCJleHAiOjE2ODk2MDQ4MDB9.signature"
    //
    // Cấu trúc JWT:
    // header.payload.signature
    //
    // header: { alg: "HS256", typ: "JWT" }
    // payload: { sub: "user-id", email: "...", iat: ..., exp: ... }
    // signature: HMACSHA256(header + payload, secret)
  }
}
```

**BCRYPT HASHING:**

```
Plain Password: "Password@123"
                    ↓
bcrypt.hash(password, 10)
                    ↓
Hashed: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
         ││││└─────────────────────────────────────────┘
         │││└─ Salt (random, 22 chars)
         ││└── Cost factor (10 = 2^10 = 1024 iterations)
         │└─── bcrypt version (2a)
         └──── Algorithm identifier ($)

Đặc điểm:
- Mỗi lần hash cùng 1 password → kết quả KHÁC NHAU (vì salt random)
- Không thể decode ngược lại (one-way function)
- So sánh dùng bcrypt.compare(plain, hash) → boolean
```

---

### 4. **jwt.strategy.ts** - JWT Token Validation

```typescript
/**
 * NHIỆM VỤ:
 * - Passport tự động gọi strategy này khi có request đến protected route
 * - Extract JWT token từ Authorization header
 * - Verify token signature với secret key
 * - Decode payload từ token
 * - Validate user từ payload
 * - Attach user vào request.user
 */

export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private blacklistService: TokenBlacklistService,
  ) {
    super({
      // Lấy token từ đâu? → Authorization header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Có cho phép token hết hạn không? → Không
      ignoreExpiration: false,

      // Secret key để verify signature
      secretOrKey: configService.get('JWT_SECRET'),

      // Cho phép access request trong validate()
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: JwtPayload): Promise<User> {
    // 1. Extract token từ header
    const token = req.headers.authorization?.replace('Bearer ', '');
    // "Bearer eyJhbGci..." → "eyJhbGci..."

    // 2. Check token có bị blacklist không (user đã logout)
    if (await this.blacklistService.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // 3. Lấy user từ database dựa trên payload
    const user = await this.authService.validateUser(payload);
    // payload.sub = user.id

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 4. Check account còn active không
    if (!user.isActive) {
      throw new UnauthorizedException('Account disabled');
    }

    // 5. Return user → Passport tự động attach vào request.user
    return user;
  }
}
```

**TOKEN VALIDATION FLOW:**

```
1. Client gửi request:
   GET /users/profile
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. Passport extract token từ header:
   token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

3. Passport verify signature:
   verify(token, SECRET_KEY) → Valid ✓

4. Passport decode payload:
   {
     sub: "user-id-123",
     email: "user@test.com",
     role: "user",
     iat: 1689000000,    // issued at
     exp: 1689604800     // expires at
   }

5. Passport gọi JwtStrategy.validate(payload):
   - Check blacklist
   - Load user từ database
   - Check isActive
   → Return user

6. Passport attach user vào request:
   request.user = { id, email, firstName, ..., role }

7. Controller nhận request với user đã attached:
   @Get('profile')
   getProfile(@GetUser() user: User) {
     // user = request.user
     return user;
   }
```

---

### 5. **jwt-auth.guard.ts** - Protect Routes

```typescript
/**
 * NHIỆM VỤ:
 * - Guard này chặn request TRƯỚC KHI vào controller
 * - Kiểm tra route có @Public() decorator không
 * - Nếu không public → require JWT token
 * - Gọi JwtStrategy để validate token
 * - Nếu invalid → throw UnauthorizedException
 */

export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 1. Check route có @Public() decorator không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Nếu public → cho phép truy cập ngay
    if (isPublic) {
      return true;
    }

    // 3. Không public → require authentication
    // Gọi AuthGuard('jwt') → trigger JwtStrategy
    return super.canActivate(context);
  }
}
```

**SỬ DỤNG:**

```typescript
// Protect route - require JWT token
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@GetUser() user: User) {
  return user;
}

// Public route - không cần token
@Public()
@Get('public-info')
getPublicInfo() {
  return { message: 'Anyone can see this' };
}
```

---

### 6. **roles.guard.ts** - Authorization (Phân quyền)

```typescript
/**
 * NHIỆM VỤ:
 * - Kiểm tra user có role phù hợp không
 * - Dùng sau JwtAuthGuard (đã có request.user)
 * - Đọc @Roles() decorator để biết roles cần thiết
 * - So sánh user.role với required roles
 */

export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy required roles từ @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Nếu không có @Roles() → cho phép tất cả
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Lấy user từ request (đã được set bởi JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();

    // 4. Check user có role phù hợp không
    return user?.role ? requiredRoles.includes(user.role) : false;
  }
}
```

**SỬ DỤNG:**

```typescript
// Chỉ admin mới truy cập được
@UseGuards(JwtAuthGuard, RolesGuard)  // Thứ tự quan trọng!
@Roles(UserRole.ADMIN)
@Get('admin/users')
getAllUsers() {
  return this.userService.findAll();
}

// User và Admin đều truy cập được
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.ADMIN)
@Get('my-orders')
getMyOrders(@GetUser() user: User) {
  return this.orderService.findByUser(user.id);
}
```

**THỨ TỰ THỰC THI GUARDS:**

```
1. JwtAuthGuard
   ├─ Validate JWT token
   ├─ Attach user to request
   └─ Pass → Next guard

2. RolesGuard
   ├─ Read @Roles() decorator
   ├─ Check user.role
   └─ Pass/Fail → Controller/Exception
```

---

### 7. **Decorators** - Custom Decorators

#### **@Public()** - Đánh dấu route public

```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Sử dụng:
@Public()
@Get('health')
healthCheck() {
  return { status: 'ok' };
}
```

#### **@Roles()** - Định nghĩa roles

```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) =>
  SetMetadata(ROLES_KEY, roles);

// Sử dụng:
@Roles(UserRole.ADMIN)
@Delete(':id')
deleteUser(@Param('id') id: string) {
  return this.userService.delete(id);
}
```

#### **@GetUser()** - Lấy user từ request

```typescript
export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User;

    // Nếu có data → return property cụ thể
    // @GetUser('id') → return user.id
    // @GetUser() → return toàn bộ user
    return data ? user?.[data] : user;
  }
);

// Sử dụng:
@Get('profile')
getProfile(@GetUser() user: User) {
  return user;
}

@Get('my-id')
getMyId(@GetUser('id') userId: string) {
  return { userId };
}
```

---

### 8. **DTOs** - Data Validation

#### **RegisterDto**

```typescript
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string; // Validate email format

  @IsStrongPassword() // Custom validator
  @MinLength(8)
  password: string; // Min 8 chars, có uppercase, lowercase, number

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string; // Optional field
}
```

**VALIDATION FLOW:**

```
Request: POST /auth/register
Body: {
  "email": "invalid-email",
  "password": "123",
  "firstName": "John"
}

↓ NestJS ValidationPipe

Errors:
- email must be a valid email
- password must be at least 8 characters
- password must contain uppercase, lowercase, and number
- lastName is required

↓ Throw BadRequestException

Response: 400 Bad Request
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be at least 8 characters",
    ...
  ],
  "error": "Bad Request"
}
```

---

### 9. **token-blacklist.service.ts** - Token Revocation

```typescript
/**
 * NHIỆM VỤ:
 * - Quản lý tokens bị thu hồi (logout, security breach)
 * - Check token có trong blacklist không
 * - Clean up expired tokens
 */

export class TokenBlacklistService {
  // Thêm token vào blacklist
  async addToBlacklist(
    token: string,
    userId: string,
    reason: string,
    expiresAt: Date,
  ) {
    await this.repository.save({
      token,
      userId,
      reason, // 'logout', 'password_changed', 'security_breach'
      expiresAt,
    });
  }

  // Kiểm tra token có bị blacklist không
  async isBlacklisted(token: string): Promise<boolean> {
    const found = await this.repository.findOne({
      where: { token },
    });
    return !!found; // Convert to boolean
  }

  // Xóa tokens đã hết hạn (chạy định kỳ với Cron)
  async cleanupExpiredTokens() {
    await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
```

**USE CASE:**

```typescript
// Logout endpoint
@Post('logout')
@UseGuards(JwtAuthGuard)
async logout(
  @GetUser() user: User,
  @Headers('authorization') auth: string
) {
  const token = auth.replace('Bearer ', '');

  // Decode token để lấy expiry time
  const decoded = this.jwtService.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);

  // Add to blacklist
  await this.blacklistService.addToBlacklist(
    token,
    user.id,
    'logout',
    expiresAt
  );

  return { message: 'Logged out successfully' };
}
```

---

## 🔐 BẢO MẬT (Security)

### 1. **Password Security**

```
✓ Hash với bcrypt (10 rounds)
✓ Không lưu plain password
✓ Không trả password trong response
✓ Strong password validation
```

### 2. **JWT Security**

```
✓ Secret key từ environment (.env)
✓ Token expiration (7 days)
✓ Signature verification
✓ Token blacklist (logout, revoke)
```

### 3. **Error Messages**

```
✓ "Invalid email or password" (không tiết lộ email có tồn tại không)
✓ Generic error messages (prevent information leakage)
```

### 4. **Database Queries**

```
✓ Explicit field selection (không load password khi không cần)
✓ Only fetch necessary fields
✓ Optimized queries
```

---

## 💡 BEST PRACTICES ĐÃ ÁP DỤNG

1. ✅ **Separation of Concerns** - Controller/Service/Repository pattern
2. ✅ **Single Responsibility** - Mỗi class có 1 nhiệm vụ rõ ràng
3. ✅ **Dependency Injection** - Loose coupling, dễ test
4. ✅ **DTOs** - Validate input, type-safe
5. ✅ **Guards** - Reusable authentication/authorization logic
6. ✅ **Decorators** - Clean, readable code
7. ✅ **Repository Pattern** - Abstract database access
8. ✅ **Error Handling** - Proper HTTP status codes & messages
9. ✅ **Security** - Password hashing, token blacklist, safe error messages
10. ✅ **Documentation** - Swagger integration, JSDoc comments

---

## 🧪 TESTING CHECKLIST

```bash
# 1. Register với data hợp lệ
POST /auth/register
{
  "email": "test@example.com",
  "password": "Password@123",
  "firstName": "John",
  "lastName": "Doe"
}
→ Expect: 201 Created, có access_token

# 2. Register với email trùng
POST /auth/register (cùng email)
→ Expect: 409 Conflict

# 3. Register với password yếu
POST /auth/register
{
  "password": "123"
}
→ Expect: 400 Bad Request

# 4. Login với credentials đúng
POST /auth/login
{
  "email": "test@example.com",
  "password": "Password@123"
}
→ Expect: 200 OK, có access_token

# 5. Login với password sai
POST /auth/login (sai password)
→ Expect: 401 Unauthorized

# 6. Access protected route không có token
GET /users/profile
→ Expect: 401 Unauthorized

# 7. Access protected route có token hợp lệ
GET /users/profile
Authorization: Bearer <token>
→ Expect: 200 OK, có user data

# 8. Access protected route token hết hạn
GET /users/profile
Authorization: Bearer <expired-token>
→ Expect: 401 Unauthorized

# 9. Access admin route với user role
GET /admin/users
Authorization: Bearer <user-token>
→ Expect: 403 Forbidden

# 10. Access admin route với admin role
GET /admin/users
Authorization: Bearer <admin-token>
→ Expect: 200 OK
```

---

## 📊 PERFORMANCE OPTIMIZATIONS

1. **Database Queries**
   - Select only needed fields
   - Use indexes on email field
   - Exclude password by default

2. **Token Validation**
   - Check blacklist efficiently
   - Consider Redis for blacklist (faster than DB)

3. **Password Hashing**
   - bcrypt 10 rounds (balance security/performance)
   - Hash asynchronously (non-blocking)

---

## 🚀 NEXT STEPS

1. **Implement Missing Endpoints**
   - Forgot password
   - Reset password
   - Change password
   - Email verification
   - Refresh token

2. **Add Rate Limiting**

   ```bash
   npm install @nestjs/throttler
   ```

3. **Add Redis for Blacklist**

   ```bash
   npm install @nestjs/redis ioredis
   ```

4. **Add Unit Tests**
   - AuthService tests
   - Guard tests
   - Controller tests

5. **Add Email Service**
   - Password reset emails
   - Email verification

---

## 📚 TÀI LIỆU THAM KHẢO

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport.js](http://www.passportjs.org/)
- [JWT.io](https://jwt.io/)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)
