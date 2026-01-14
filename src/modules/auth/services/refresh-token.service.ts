import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { LessThan, Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';

/**
 * RefreshTokenService
 * Manages refresh token lifecycle including creation, validation, and revocation
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Create and store a new refresh token
   */
  async createRefreshToken(
    token: string,
    userId: string,
    expiresAt: Date,
    deviceInfo?: string,
    ipAddress?: string,
    tokenFamilyId?: string,
  ): Promise<RefreshToken> {
    const familyId = tokenFamilyId || randomUUID();

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      deviceInfo,
      ipAddress,
      tokenFamilyId: familyId,
      isRevoked: false,
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  /**
   * Find refresh token by token string
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.refreshTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  /**
   * Validate refresh token (not expired, not revoked)
   */
  async validateRefreshToken(token: string): Promise<{ token: RefreshToken | null; reused: boolean }> {
    const refreshToken = await this.findByToken(token);

    if (!refreshToken) {
      return { token: null, reused: false };
    }

    // If already revoked, treat as reuse attempt and revoke entire family
    if (refreshToken.isRevoked) {
      await this.revokeFamilyTokens(refreshToken.tokenFamilyId);
      this.logger.warn(`Refresh token reuse detected for family ${refreshToken.tokenFamilyId}`);
      return { token: null, reused: true };
    }

    // Check if token is expired
    if (new Date() > refreshToken.expiresAt) {
      return { token: null, reused: false };
    }

    return { token: refreshToken, reused: false };
  }

  /**
   * Revoke a specific refresh token (for logout)
   */
  async revokeToken(token: string): Promise<boolean> {
    const result = await this.refreshTokenRepository.update({ token }, { isRevoked: true });

    return (result.affected ?? 0) > 0;
  }

  /**
   * Revoke all refresh tokens for a user (for logout all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update({ userId, isRevoked: false }, { isRevoked: true });

    return result.affected || 0;
  }

  /**
   * Revoke all tokens in the same family (reuse detection response)
   */
  async revokeFamilyTokens(tokenFamilyId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update({ tokenFamilyId }, { isRevoked: true });
    return result.affected || 0;
  }

  /**
   * Delete a refresh token from database (for token rotation)
   */
  async deleteToken(token: string): Promise<boolean> {
    const result = await this.refreshTokenRepository.delete({ token });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Clean up expired tokens (should be called by cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    const count = result.affected || 0;
    this.logger.log(`Cleaned up ${count} expired refresh tokens`);
    return count;
  }

  /**
   * Get all active tokens for a user
   */
  async getUserActiveTokens(userId: string): Promise<RefreshToken[]> {
    return await this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Count active tokens for a user
   */
  async countUserActiveTokens(userId: string): Promise<number> {
    return await this.refreshTokenRepository.count({
      where: {
        userId,
        isRevoked: false,
      },
    });
  }
}
