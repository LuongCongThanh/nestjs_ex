import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AUTH_CONFIG } from '../auth.constants';

@Injectable()
export class PasswordService {
  /**
   * Hashes a plain text password using bcrypt.
   * @param password The plain text password to hash.
   * @returns A promise that resolves to the hashed password.
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(AUTH_CONFIG.SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plain text password with a hashed password.
   * @param password The plain text password.
   * @param hash The hashed password to compare against.
   * @returns A promise that resolves to true if the passwords match, false otherwise.
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
