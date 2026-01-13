import { ApiResponse } from '@nestjs/swagger';

/**
 * Register Response - New user registration
 */
export const RegisterResponse = ApiResponse({
  status: 201,
  description: 'User registered successfully',
  schema: {
    example: {
      statusCode: 201,
      success: true,
      message: 'User registered successfully',
      data: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDUwMDAwMDAsImV4cCI6MTcwNTYwNDgwMH0.example',
        user: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          role: 'user',
          isActive: true,
          emailVerified: false,
          createdAt: '2026-01-12T00:00:00.000Z',
          updatedAt: '2026-01-12T00:00:00.000Z',
        },
      },
    },
  },
});

/**
 * Login Response - User login
 */
export const LoginResponse = ApiResponse({
  status: 200,
  description: 'User logged in successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'User logged in successfully',
      data: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1dWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3MDUwMDAwMDAsImV4cCI6MTcwNTYwNDgwMH0.example',
        user: {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+1234567890',
          role: 'user',
          isActive: true,
          emailVerified: true,
          createdAt: '2026-01-12T00:00:00.000Z',
          updatedAt: '2026-01-12T00:00:00.000Z',
        },
      },
    },
  },
});

/**
 * Logout Response - User logout
 */
export const LogoutResponse = ApiResponse({
  status: 200,
  description: 'User logged out successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'User logged out successfully',
    },
  },
});

/**
 * Get Current User Response
 */
export const GetCurrentUserResponse = ApiResponse({
  status: 200,
  description: 'Current user retrieved successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'User retrieved successfully',
      data: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'user',
        isActive: true,
        emailVerified: true,
        createdAt: '2026-01-12T00:00:00.000Z',
        updatedAt: '2026-01-12T00:00:00.000Z',
      },
    },
  },
});

/**
 * Refresh Token Response
 */
export const RefreshTokensResponse = ApiResponse({
  status: 200,
  description: 'Tokens refreshed successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new.access.token',
        refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new.refresh.token',
      },
    },
  },
});

/**
 * Forgot Password Response
 */
export const ForgotPasswordResponse = ApiResponse({
  status: 200,
  description: 'Password reset email sent successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Password reset email sent successfully',
      data: {
        email: 'user@example.com',
      },
    },
  },
});

/**
 * Reset Password Response
 */
export const ResetPasswordResponse = ApiResponse({
  status: 200,
  description: 'Password reset successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Password reset successfully',
    },
  },
});

/**
 * Change Password Response
 */
export const ChangePasswordResponse = ApiResponse({
  status: 200,
  description: 'Password changed successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Password changed successfully',
      data: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new.access.token',
      },
    },
  },
});

/**
 * Verify Email Response
 */
export const VerifyEmailResponse = ApiResponse({
  status: 200,
  description: 'Email verified successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Email verified successfully',
      data: {
        emailVerified: true,
      },
    },
  },
});

/**
 * Resend OTP Response
 */
export const ResendOtpResponse = ApiResponse({
  status: 200,
  description: 'OTP resent successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'OTP resent successfully',
      data: {
        email: 'user@example.com',
      },
    },
  },
});

/**
 * Verify OTP Response
 */
export const VerifyOtpResponse = ApiResponse({
  status: 200,
  description: 'OTP verified successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'OTP verified successfully',
      data: {
        verified: true,
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.access.token',
      },
    },
  },
});

/**
 * Unauthorized Response
 */
export const UnauthorizedResponse = ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid credentials or token',
  schema: {
    example: {
      statusCode: 401,
      message: 'Invalid email or password',
      error: 'Unauthorized',
    },
  },
});

/**
 * Conflict Response - Email already exists
 */
export const ConflictResponse = ApiResponse({
  status: 409,
  description: 'Conflict - Email already exists',
  schema: {
    example: {
      statusCode: 409,
      message: 'User with this email already exists',
      error: 'Conflict',
    },
  },
});

/**
 * Bad Request Response - Validation error
 */
export const BadRequestResponse = ApiResponse({
  status: 400,
  description: 'Bad Request - Validation error',
  schema: {
    example: {
      statusCode: 400,
      message: ['email must be an email', 'password must be at least 8 characters'],
      error: 'Bad Request',
    },
  },
});
