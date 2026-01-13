# Users Module - Quick Test

## API Endpoints

Base URL: `http://localhost:3000/api/v1/users`

### 1. Create User (POST /api/v1/users)

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "0987654321"
  }'
```

**Expected Response (201):**

```json
{
  "id": "uuid-here",
  "email": "testuser@example.com",
  "firstName": "Test",
  "lastName": "User",
  "phone": "0987654321",
  "role": "user",
  "isActive": true,
  "emailVerified": false,
  "createdAt": "2026-01-11T...",
  "updatedAt": "2026-01-11T..."
}
```

Note: `password` field is automatically excluded (@Exclude decorator)

### 2. Get All Users (GET /api/v1/users)

```bash
curl http://localhost:3000/api/v1/users
```

### 3. Get User by ID (GET /api/v1/users/:id)

```bash
curl http://localhost:3000/api/v1/users/{user-id}
```

### 4. Update User (PATCH /api/v1/users/:id)

```bash
curl -X PATCH http://localhost:3000/api/v1/users/{user-id} \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }'
```

### 5. Delete User (DELETE /api/v1/users/:id)

```bash
curl -X DELETE http://localhost:3000/api/v1/users/{user-id}
```

## Validation Tests

### ❌ Invalid Email

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "Test@123"
  }'
```

**Expected: 400 Bad Request**

### ❌ Weak Password

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "12345678"
  }'
```

**Expected: 400 Bad Request** - Must contain uppercase, lowercase, number

### ❌ Duplicate Email

```bash
# Create user twice with same email
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "duplicate@example.com",
    "password": "Test@123"
  }'
```

**Expected: 409 Conflict** on second request

## Features Implemented

- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Soft delete (sets isActive = false)
- ✅ Password hashing with bcryptjs
- ✅ Email uniqueness validation
- ✅ Strong password validation (min 8 chars, uppercase, lowercase, number)
- ✅ Password exclusion from responses (@Exclude)
- ✅ ClassSerializerInterceptor for automatic transformation
- ✅ Email verification support (emailVerified field)
- ✅ Change password method
- ✅ Role-based access (user, admin, staff)
- ✅ Swagger documentation

## Security Features

1. **Password Hashing**: bcryptjs with 10 rounds
2. **Password Exclusion**: @Exclude decorator prevents password exposure
3. **Email Verification**: emailVerified flag for verification workflow
4. **Soft Delete**: Preserves data, sets isActive = false
5. **UUID Primary Key**: Prevents enumeration attacks
6. **Input Validation**: class-validator decorators

## Next Steps

- [ ] Add JWT authentication (TASK-00012)
- [ ] Add authorization guards (role-based)
- [ ] Add email verification flow
- [ ] Add password reset flow
- [ ] Add unit tests (TASK-00033)
- [ ] Add pagination for GET /users
