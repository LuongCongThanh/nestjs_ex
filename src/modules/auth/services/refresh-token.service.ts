import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
  ): Promise<RefreshToken> {
    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      deviceInfo,
      ipAddress,
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
  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.findByToken(token);

    if (!refreshToken) {
      return null;
    }

    // Check if token is revoked
    if (refreshToken.isRevoked) {
      return null;
    }

    // Check if token is expired
    if (new Date() > refreshToken.expiresAt) {
      return null;
    }

    return refreshToken;
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
