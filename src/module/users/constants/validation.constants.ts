/**
 * Validation constants for user-related operations
 */
export const USER_VALIDATION_CONSTANTS = {
  FULL_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
} as const;

/**
 * Regular expression patterns for user validation
 */
export const USER_REGEX_PATTERNS = {
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
} as const;

/**
 * Validation error messages for user operations
 */
export const USER_VALIDATION_MESSAGES = {
  FULL_NAME: {
    REQUIRED: 'Full name is required',
    STRING: 'Full name must be a string',
    MIN_LENGTH: `Full name must be at least ${USER_VALIDATION_CONSTANTS.FULL_NAME.MIN_LENGTH} characters long`,
    MAX_LENGTH: `Full name must not exceed ${USER_VALIDATION_CONSTANTS.FULL_NAME.MAX_LENGTH} characters`,
  },
  EMAIL: {
    REQUIRED: 'Email is required',
    INVALID: 'Please provide a valid email address',
    MAX_LENGTH: `Email must not exceed ${USER_VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH} characters`,
  },
  PASSWORD: {
    REQUIRED: 'Password is required',
    STRING: 'Password must be a string',
    MIN_LENGTH: `Password must be at least ${USER_VALIDATION_CONSTANTS.PASSWORD.MIN_LENGTH} characters long`,
    MAX_LENGTH: `Password must not exceed ${USER_VALIDATION_CONSTANTS.PASSWORD.MAX_LENGTH} characters`,
    PATTERN:
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
  },
  PHONE: {
    STRING: 'Phone number must be a string',
    PATTERN: 'Phone number must be a valid international format',
  },
} as const;
