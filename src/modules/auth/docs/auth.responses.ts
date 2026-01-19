import { ApiResponse } from '@nestjs/swagger';

/**
 * Standard Success Response Schema
 */
// SuccessSchema was unused, removing.

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
      message: 'Registration successful. Please check your email for verification.',
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
        accessToken: 'eyJhbGciOiJIUzI1Ni... (short-lived)',
        refreshToken: '7c8d9e... (long-lived / hashed in DB)',
        user: {
          id: 'uuid-v4-string',
          email: 'user@example.com',
          firstName: 'Thanh',
          lastName: 'Luong',
          role: 'USER',
          isActive: true,
          emailVerified: true,
          lastLoginAt: '2024-01-19T10:00:00.000Z',
          createdAt: '2024-01-19T09:00:00.000Z',
          updatedAt: '2024-01-19T10:00:00.000Z',
        },
      },
    },
  },
});

/**
 * Response for successful token refresh.
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
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: 'uuid', email: '...', role: 'USER' },
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
      message: 'Email verified successfully!',
    },
  },
});

/**
 * Response for successful resend verification link.
 */
export const ResendVerificationResponse = ApiResponse({
  status: 200,
  description: 'Verification link resent successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Verification email sent.',
    },
  },
});

/**
 * Response for forgot password request.
 */
export const ForgotPasswordResponse = ApiResponse({
  status: 200,
  description: 'Password reset email sent successfully (if user exists)',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Check your email to reset password',
    },
  },
});

/**
 * Response for successful password reset.
 */
export const ResetPasswordResponse = ApiResponse({
  status: 200,
  description: 'Password reset successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Password updated successfully!',
    },
  },
});

/**
 * Response for successful password change (Authenticated).
 */
export const ChangePasswordResponse = ApiResponse({
  status: 200,
  description: 'Password changed successfully',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Password changed successfully',
    },
  },
});

/**
 * Response for successful logout.
 */
export const LogoutResponse = ApiResponse({
  status: 200,
  description: 'Logout successful',
  schema: {
    example: {
      statusCode: 200,
      success: true,
      message: 'Logout successful',
    },
  },
});

/**
 * Error: Unauthorized (401)
 */
export const UnauthorizedResponse = ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid credentials or token',
  schema: {
    example: {
      statusCode: 401,
      timestamp: '2024-01-19T10:00:00.000Z',
      path: '/api/v1/auth/login',
      method: 'POST',
      message: 'Invalid email or password',
    },
  },
});

/**
 * Error: Forbidden (403)
 */
export const ForbiddenResponse = ApiResponse({
  status: 403,
  description: 'Forbidden - Unverified email or disabled account',
  schema: {
    example: {
      statusCode: 403,
      timestamp: '2024-01-19T10:00:00.000Z',
      path: '/api/v1/auth/login',
      method: 'POST',
      message: 'Email not verified',
    },
  },
});

/**
 * Error: Conflict (409)
 */
export const ConflictResponse = ApiResponse({
  status: 409,
  description: 'Conflict - Email already exists',
  schema: {
    example: {
      statusCode: 409,
      timestamp: '2024-01-19T10:00:00.000Z',
      path: '/api/v1/auth/register',
      method: 'POST',
      message: 'Email already exists',
    },
  },
});

/**
 * Error: Bad Request / Validation (400)
 */
export const BadRequestResponse = ApiResponse({
  status: 400,
  description: 'Bad Request - Validation failed',
  schema: {
    example: {
      statusCode: 400,
      timestamp: '2024-01-19T10:00:00.000Z',
      path: '/api/v1/auth/register',
      method: 'POST',
      message: 'Bad Request Exception',
      errors: ['email must be an email', 'password must be longer than or equal to 8 characters'],
    },
  },
});
