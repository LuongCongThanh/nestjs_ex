/**
 * JWT Payload structure used for access, refresh, and stateless tokens.
 */
export interface JwtPayload {
  /** User unique identifier. */
  sub: string;
  /** User email address. */
  email: string;
  /** User role (e.g., USER, ADMIN). */
  role: string;
  /** Specific token type (e.g., verify_email, reset_password). */
  type?: string;
  /** Issued at (Unix timestamp). */
  iat?: number;
  /** Expiration time (Unix timestamp). */
  exp?: number;
  /** JSON Web Token ID (unique identifier for the token). */
  jti?: string;
}
