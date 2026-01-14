import { ApiResponse } from '@nestjs/swagger';

/**
 * Response for successful user registration.
 */
export const RegisterResponse = ApiResponse({
  status: 201,
  description: 'User registered successfully. Email verification link sent.',
  schema: {
    example: {
      statusCode: 201,
      success: true,
      message: 'Registration successful! Please check your email to verify your account before logging in.',
      data: {
        email: 'user@example.com',
        emailSent: true,
      },
    },
  },
});

/**
 * Response for successful user login.
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
 * Response for successful user logout.
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
 * Response for retrieving the current authenticated user's profile.
 */
export const GetCurrentUserResponse = ApiResponse({
  status: 200,
  description: 'Current user retrieved successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Current user retrieved successfully',
      data: {
        id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'user',
      },
    },
  },
});

/**
 * Response for successful token refresh operation.
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
        access_token: 'new.access.token',
        refresh_token: 'new.refresh.token',
      },
    },
  },
});

/**
 * Response when a password reset email has been successfully initiated.
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
 * Response for a successful password reset operation.
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
 * Response for a successful password change operation.
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
 * Response for successful email verification.
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
 * Response when an email verification link is successfully resent.
 */
export const ResendVerificationResponse = ApiResponse({
  status: 200,
  description: 'Verification link resent successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Verification link resent successfully. Please check your email.',
      data: {
        email: 'user@example.com',
      },
    },
  },
});

/**
 * Response for successful verification operation.
 */
export const VerificationResponse = ApiResponse({
  status: 200,
  description: 'Verification successful',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Email verified successfully',
      data: {
        verified: true,
      },
    },
  },
});

/**
 * Error response for unauthorized requests (invalid credentials or token).
 */
export const UnauthorizedResponse = ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid credentials or expired token',
  schema: {
    example: {
      statusCode: 401,
      success: false,
      message: 'Invalid email or password',
      errorCode: 'AUTH_INVALID_CREDENTIALS',
      timestamp: '2026-01-14T10:00:00.000Z',
      path: '/auth/login',
    },
  },
});

/**
 * Error response for conflicts, such as when an email already exists in the system.
 */
export const ConflictResponse = ApiResponse({
  status: 409,
  description: 'Conflict - Resource already exists (e.g., email)',
  schema: {
    example: {
      statusCode: 409,
      success: false,
      message: 'User with this email already exists',
      errorCode: 'AUTH_EMAIL_EXISTS',
      timestamp: '2026-01-14T10:00:00.000Z',
      path: '/auth/register',
    },
  },
});

/**
 * Error response for bad requests, typically due to validation failures.
 */
export const BadRequestResponse = ApiResponse({
  status: 400,
  description: 'Bad Request - Validation failed or invalid input',
  schema: {
    example: {
      statusCode: 400,
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: [
        {
          field: 'email',
          message: 'Please provide a valid email address',
        },
        {
          field: 'password',
          message: 'Password must be at least 8 characters long',
        },
      ],
      timestamp: '2026-01-14T10:00:00.000Z',
      path: '/auth/register',
    },
  },
});

/**
 * Error response for forbidden requests (e.g., email not verified or account disabled).
 */
export const ForbiddenResponse = ApiResponse({
  status: 403,
  description: 'Forbidden - Account inactive or email not verified',
  schema: {
    example: {
      statusCode: 403,
      success: false,
      message: 'Email not verified. Please check your inbox.',
      errorCode: 'AUTH_EMAIL_NOT_VERIFIED',
      timestamp: '2026-01-14T10:00:00.000Z',
      path: '/auth/login',
    },
  },
});
