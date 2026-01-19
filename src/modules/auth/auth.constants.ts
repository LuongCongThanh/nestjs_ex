/**
 * Authentication constants and configuration values.
 */
export const AUTH_CONFIG = {
  /** Cost factor for bcrypt password hashing. */
  SALT_ROUNDS: 12,
  /** Maximum number of concurrent active sessions (refresh tokens) allowed per user. */
  MAX_SESSIONS: 5,
  /** Duration in days before a refresh token expires. */
  REFRESH_TOKEN_TTL_DAYS: 7,
  /** Duration in minutes before a password reset token expires. */
  PASSWORD_RESET_TOKEN_TTL_MINUTES: 15,
  /** Duration in hours before an email verification token expires. */
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS: 24,
};

/**
 * Standardized token types used in JWT payloads.
 */
export const TOKEN_TYPES = {
  /** Token used specifically for email verification. */
  VERIFY_EMAIL: 'verify_email',
  /** Token used specifically for password reset. */
  RESET_PASSWORD: 'reset_password',
};
