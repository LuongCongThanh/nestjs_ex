import { ApiProperty } from '@nestjs/swagger';

/**
 * Common Error Response (400 Bad Request).
 * Used for validation errors and invalid client input.
 */
export class ErrorResponseDto {
  /** The HTTP status code (usually 400). */
  @ApiProperty({
    example: 400,
    description: 'The HTTP response status code',
  })
  statusCode: number;

  /** The type of error (e.g., "Bad Request"). */
  @ApiProperty({
    example: 'Bad Request',
    description: 'Short name for the error category',
  })
  error: string;

  /** Detailed error message(s). Can be a single string or an array for validation errors. */
  @ApiProperty({
    example: 'Validation failed',
    description: 'Details about what went wrong with the request',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  /** ISO 8601 timestamp of when the error occurred. */
  @ApiProperty({
    example: '2026-01-11T12:00:00.000Z',
    description: 'UTC timestamp of the error occurrence',
  })
  timestamp: string;

  /** The endpoint path that triggered the error. */
  @ApiProperty({
    example: '/api/v1/users',
    description: 'The API endpoint path that was requested',
  })
  path: string;
}

/**
 * Conflict Error Response (409 Conflict).
 * Used when a resource already exists (e.g., duplicate email during registration).
 */
export class ConflictErrorResponseDto {
  @ApiProperty({ example: 409, description: 'HTTP Conflict status code' })
  statusCode: number;

  @ApiProperty({ example: 'Conflict', description: 'Error type' })
  error: string;

  @ApiProperty({ example: 'User with this email already exists', description: 'Conflict details' })
  message: string;

  @ApiProperty({ example: '2026-01-11T12:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users', description: 'Request path' })
  path: string;
}

/**
 * Not Found Error Response (404 Not Found).
 * Used when a requested resource does not exist.
 */
export class NotFoundErrorResponseDto {
  @ApiProperty({ example: 404, description: 'HTTP Not Found status code' })
  statusCode: number;

  @ApiProperty({ example: 'Not Found', description: 'Error type' })
  error: string;

  @ApiProperty({ example: 'User with ID not found', description: 'Not found details' })
  message: string;

  @ApiProperty({ example: '2026-01-11T12:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/users/uuid-here', description: 'Request path' })
  path: string;
}
