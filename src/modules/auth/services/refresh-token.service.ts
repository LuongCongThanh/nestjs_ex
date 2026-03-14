import { Injectable, Logger } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * RefreshTokenService
 * Manages refresh token lifecycle including creation, validation, and revocation
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    return await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
        deviceInfo,
        ipAddress,
        isRevoked: false,
      },
    });
  }

  /**
   * Find refresh token by token string
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
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
    try {
      await this.prisma.refreshToken.update({
        where: { token },
        data: { isRevoked: true },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoke all refresh tokens for a user (for logout all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    return result.count;
  }

  /**
   * Delete a refresh token from database (for token rotation)
   */
  async deleteToken(token: string): Promise<boolean> {
    try {
      await this.prisma.refreshToken.delete({
        where: { token },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up expired tokens (should be called by cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
    return result.count;
  }

  /**
   * Get all active tokens for a user
   */
  async getUserActiveTokens(userId: string): Promise<RefreshToken[]> {
    return await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Count active tokens for a user
   */
  async countUserActiveTokens(userId: string): Promise<number> {
    return await this.prisma.refreshToken.count({
      where: {
        userId,
        isRevoked: false,
      },
    });
  }
}
