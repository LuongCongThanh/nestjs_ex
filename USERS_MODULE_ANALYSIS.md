# Users Module Documentation

## Overview

This module provides a complete CRUD (Create, Read, Update, Delete) API for user management using NestJS, Prisma, and PostgreSQL.

## Features

### ✅ **Complete CRUD Operations**

- Create new users
- Get all users (with sorting)
- Get user by ID
- Update user information
- Delete users

### ✅ **Robust Validation**

- Email format validation
- Password strength requirements (8+ chars, uppercase, lowercase, number, special character)
- Phone number validation (international format)
- Name length validation (2-100 characters)

### ✅ **Error Handling**

- Duplicate email detection
- User not found handling
- Input validation errors
- Database error handling

### ✅ **Complete Swagger Documentation**

- All endpoints documented
- Request/response examples
- Error response schemas
- Parameter descriptions

### ✅ **Security Considerations**

- Input validation with class-validator
- SQL injection protection via Prisma
- Type safety with TypeScript

## API Endpoints

### POST /users

Create a new user

- **Body**: CreateUserDto
- **Response**: Created user object
- **Status Codes**: 201 (Created), 400 (Bad Request), 422 (Email exists)

### GET /users

Get all users

- **Response**: Array of user objects
- **Status Codes**: 200 (OK), 500 (Internal Server Error)

### GET /users/:id

Get user by ID

- **Parameters**: id (number)
- **Response**: User object
- **Status Codes**: 200 (OK), 400 (Invalid ID), 404 (Not Found)

### PATCH /users/:id

Update user information

- **Parameters**: id (number)
- **Body**: UpdateUserDto
- **Response**: Updated user object
- **Status Codes**: 200 (OK), 400 (Bad Request), 404 (Not Found), 422 (Email exists)

### DELETE /users/:id

Delete user

- **Parameters**: id (number)
- **Response**: No content
- **Status Codes**: 204 (No Content), 400 (Invalid ID), 404 (Not Found)

## Data Models

### User Entity

```typescript
{
  id: number;                    // Auto-generated unique identifier
  fullName: string;              // User's full name (2-100 chars)
  email: string;                 // Unique email address
  password: string;              // Password (8+ chars with complexity requirements)
  phone?: string;                // Optional phone number (international format)
  createdAt: Date;               // Auto-generated creation timestamp
  updatedAt: Date;               // Auto-updated modification timestamp
}
```

### CreateUserDto

```typescript
{
  fullName: string;              // Required, 2-100 characters
  email: string;                 // Required, valid email format
  password: string;              // Required, 8+ chars, complex password
  phone?: string;                // Optional, international phone format
}
```

## Validation Rules

### Full Name

- Required field
- Must be a string
- Length: 2-100 characters

### Email

- Required field
- Must be valid email format
- Must be unique in the system
- Maximum 255 characters

### Password

- Required field
- Minimum 8 characters
- Maximum 128 characters
- Must contain at least:
  - One lowercase letter
  - One uppercase letter
  - One number
  - One special character (@$!%\*?&)

### Phone (Optional)

- Must match international format pattern: `^\+?[1-9]\d{1,14}$`
- Examples: `+1234567890`, `1234567890`

## Error Responses

### 400 Bad Request

Invalid input data or malformed request

```json
{
  "statusCode": 400,
  "message": ["validation error messages"],
  "error": "Bad Request"
}
```

### 404 Not Found

User not found

```json
{
  "statusCode": 404,
  "message": "User with ID 999 not found",
  "error": "Not Found"
}
```

### 422 Unprocessable Entity

Email already exists

```json
{
  "statusCode": 422,
  "message": "Email is already being used by another user",
  "error": "Unprocessable Entity"
}
```

## Database Schema (Prisma)

```prisma
model User {
  id        Int      @id @default(autoincrement())
  fullName  String
  email     String   @unique
  password  String
  phone     String?
  createdAt DateTime @default(now()) @db.Timestamptz
  updatedAt DateTime @updatedAt @db.Timestamptz

  @@map("users")
}
```

## Improvements Made

### 🔧 **Enhanced Error Handling**

- Proper exception types (ConflictException, NotFoundException, BadRequestException)
- Database error handling with Prisma error codes
- Input validation with detailed error messages

### 🔧 **Better Validation**

- Strong password requirements
- Phone number format validation
- Detailed validation messages
- Length limits on all fields

### 🔧 **Additional Service Methods**

- `findByEmail()` - Find user by email
- `emailExists()` - Check if email is already taken

### 🔧 **Complete English Translation**

- All Vietnamese text converted to English
- Professional API documentation
- Consistent naming conventions

### 🔧 **Security Enhancements**

- Password complexity requirements
- Input sanitization through validation
- Proper error messages without exposing sensitive data

## Still Needs Implementation

### 🚧 **Security Improvements**

- Password hashing (bcrypt)
- JWT authentication
- Rate limiting
- Request sanitization

### 🚧 **Performance Optimizations**

- Pagination for `findAll()`
- Database indexing
- Response caching
- Query optimization

### 🚧 **Additional Features**

- User search functionality
- Bulk operations
- User profile management
- Email verification

### 🚧 **Testing**

- Unit tests for service methods
- Integration tests for endpoints
- E2E tests for complete workflows

## Usage Examples

### Create User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "phone": "+1234567890"
  }'
```

### Get All Users

```bash
curl -X GET http://localhost:3000/users
```

### Update User

```bash
curl -X PATCH http://localhost:3000/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "phone": "+9876543210"
  }'
```
