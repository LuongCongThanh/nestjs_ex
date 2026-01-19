import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { RefreshToken } from '../entities/refresh-token.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { AUTH_CONFIG } from '../auth.constants';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  /**
   * Hashes a token for secure storage in the database using SHA-256.
   * @param token The raw token string.
   * @returns The SHA-256 hashed token.
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // --- REFRESH TOKEN METHODS ---

  /**
   * Finds a refresh token record including associated user data.
   * @param token The raw refresh token string.
   */
  async findRefreshToken(token: string) {
    const hashedToken = this.hashToken(token);
    return this.refreshTokenRepository.findOne({
      where: { token: hashedToken },
      relations: ['user'],
    });
  }

  /**
   * Creates and persists a new refresh token for a user.
   * @param data Device metadata, expiration, and the raw token value.
   */
  async createRefreshToken(data: {
    userId: string;
    token: string;
    userAgent: string;
    ipAddress: string;
    expiresAt: Date;
  }) {
    const hashedToken = this.hashToken(data.token);
    const refreshToken = this.refreshTokenRepository.create({
      ...data,
      token: hashedToken,
    });
    return this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Revokes a specific refresh token by value.
   */
  async revokeRefreshToken(token: string) {
    const hashedToken = this.hashToken(token);
    await this.refreshTokenRepository.delete({ token: hashedToken });
  }

  /**
   * Revokes all active refresh tokens for a specific user ID.
   */
  async revokeAllUserTokens(userId: string) {
    await this.refreshTokenRepository.delete({ userId });
  }

  /**
   * Enforces concurrent session limits per user.
   * Revokes the oldest sessions if the limit defined in AUTH_CONFIG is exceeded.
   */
  async enforceMaxSessions(userId: string, userAgent?: string, ipAddress?: string) {
    if (userAgent && ipAddress) {
      await this.refreshTokenRepository.delete({ userId, userAgent, ipAddress });
    }

    const existingTokens = await this.refreshTokenRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });

    const tokensToDelete = existingTokens.length - AUTH_CONFIG.MAX_SESSIONS + 1;
    if (tokensToDelete > 0) {
      const idsToRemove = existingTokens.slice(0, tokensToDelete).map((t) => t.id);
      await this.refreshTokenRepository.delete(idsToRemove);
    }
  }

  // --- PASSWORD RESET TOKEN METHODS ---

  /**
   * Stores a newly generated password reset token.
   */
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    const hashedToken = this.hashToken(token);
    const resetToken = this.passwordResetTokenRepository.create({
      token: hashedToken,
      userId,
      expiresAt,
      usedAt: null,
    });
    return this.passwordResetTokenRepository.save(resetToken);
  }

  /**
   * Finds a valid password reset token for a user.
   */
  async findPasswordResetToken(token: string, userId: string) {
    const hashedToken = this.hashToken(token);
    return this.passwordResetTokenRepository.findOne({
      where: { token: hashedToken, userId },
    });
  }

  /**
   * Marks a password reset token as used to prevent replay attacks.
   */
  async markPasswordResetTokenAsUsed(id: string) {
    await this.passwordResetTokenRepository.update(id, { usedAt: new Date() });
  }

  /**
   * Deletes all unused password reset tokens for a user.
   */
  async cleanupPasswordResetTokens(userId: string) {
    await this.passwordResetTokenRepository.delete({ userId, usedAt: IsNull() });
  }

  /**
   * Revokes a specific password reset token by value.
   */
  async deletePasswordResetToken(token: string) {
    const hashedToken = this.hashToken(token);
    await this.passwordResetTokenRepository.delete({ token: hashedToken });
  }
}
