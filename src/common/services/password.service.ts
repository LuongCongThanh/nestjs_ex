import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
  private readonly BCRYPT_ROUNDS = 12;

  async hash(plainPassword: string): Promise<string> {
    try {
      return await bcrypt.hash(plainPassword, this.BCRYPT_ROUNDS);
    } catch (error) {
      this.logger.error('Failed to hash password', error instanceof Error ? error.stack : error);
      throw new Error('Password hashing failed');
    }
  }

  async compare(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logger.error('Failed to compare passwords', error instanceof Error ? error.stack : error);
      return false;
    }
  }

  validateStrength(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    );
  }

  needsRehash(hashedPassword: string): boolean {
    try {
      return bcrypt.getRounds(hashedPassword) < this.BCRYPT_ROUNDS;
    } catch {
      return true;
    }
  }

  getHashingConfig(): { algorithm: string; rounds: number } {
    return { algorithm: 'bcrypt', rounds: this.BCRYPT_ROUNDS };
  }
}
