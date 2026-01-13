import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/**
 * PasswordService
 *
 * Purpose: Centralize password hashing and validation logic
 *
 * Benefits:
 * - Single Responsibility Principle
 * - Easy to switch hashing algorithms (bcrypt → argon2id)
 * - Consistent hashing across the application
 * - Reusable in other modules (e.g., users module)
 *
 * 2026 Security Best Practices:
 * - Bcrypt: 12 rounds (increased from 10 due to hardware improvements)
 * - Future: Argon2id (recommended, but requires native dependencies)
 *
 * Migration Path:
 * 1. Start with bcrypt 12 rounds (current implementation)
 * 2. Later: Add Argon2id support
 * 3. Hybrid: Check hash format and use appropriate algorithm
 */
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly BCRYPT_ROUNDS = 12; // 2026 standard (increased from 10)

  /**
   * Hash a plain text password
   *
   * Uses bcrypt with 12 rounds (2026 security standard)
   * Future: Can be upgraded to Argon2id
   *
   * @param plainPassword - Plain text password from user
   * @returns Hashed password for database storage
   *
   * @example
   * const hashedPassword = await passwordService.hash('MyPassword123!');
   * // Store hashedPassword in database
   */
  async hash(plainPassword: string): Promise<string> {
    try {
      const hashedPassword = await bcrypt.hash(plainPassword, this.BCRYPT_ROUNDS);
      this.logger.debug(`Password hashed successfully with ${this.BCRYPT_ROUNDS} rounds`);
      return hashedPassword;
    } catch (error) {
      this.logger.error('Failed to hash password', error instanceof Error ? error.stack : error);
      throw new Error('Password hashing failed');
    }
  }

  /**
   * Compare plain text password with hashed password
   *
   * @param plainPassword - Plain text password from login attempt
   * @param hashedPassword - Hashed password from database
   * @returns true if passwords match, false otherwise
   *
   * @example
   * const isValid = await passwordService.compare(loginDto.password, user.password);
   * if (!isValid) throw new UnauthorizedException('Invalid credentials');
   */
  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
      return isMatch;
    } catch (error) {
      this.logger.error('Failed to compare passwords', error instanceof Error ? error.stack : error);
      return false; // Return false instead of throwing to prevent information leakage
    }
  }

  /**
   * Validate password strength
   *
   * Requirements:
   * - Minimum 8 characters
   * - At least 1 uppercase letter
   * - At least 1 lowercase letter
   * - At least 1 number
   * - At least 1 special character
   *
   * Note: This is also validated by @IsStrongPassword decorator in DTO
   * This method can be used for programmatic validation
   *
   * @param password - Plain text password to validate
   * @returns true if password meets requirements
   */
  validateStrength(password: string): boolean {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  }

  /**
   * Check if password hash needs rehashing
   *
   * Useful for gradual migration to stronger hashing
   * Example: Migrate from bcrypt 10 rounds to 12 rounds
   * Or: Migrate from bcrypt to Argon2id
   *
   * @param hashedPassword - Current hashed password from database
   * @returns true if password should be rehashed with current settings
   *
   * @example
   * if (passwordService.needsRehash(user.password)) {
   *   const newHash = await passwordService.hash(plainPassword);
   *   await userRepository.update(user.id, { password: newHash });
   * }
   */
  needsRehash(hashedPassword: string): boolean {
    try {
      // Check if hash uses current bcrypt rounds
      const rounds = bcrypt.getRounds(hashedPassword);
      return rounds < this.BCRYPT_ROUNDS;
    } catch (error) {
      // If error (e.g., not a bcrypt hash), assume it needs rehashing
      return true;
    }
  }

  /**
   * Get current hashing configuration
   *
   * Useful for logging and monitoring
   *
   * @returns Object with current hashing algorithm and cost
   */
  getHashingConfig(): { algorithm: string; rounds: number } {
    return {
      algorithm: 'bcrypt',
      rounds: this.BCRYPT_ROUNDS,
    };
  }
}
