import { Injectable, Logger } from '@nestjs/common';
import { RefreshToken } from '@prisma/client';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * RefreshTokenService
 * Manages refresh token lifecycle including creation, validation, and revocation
 */
@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private readonly prisma: PrismaService) { }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private getTokenLookupVariants(token: string): string[] {
    const hashedToken = this.hashToken(token);
    return hashedToken === token ? [token] : [token, hashedToken];
  }

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
    const hashedToken = this.hashToken(token);

    return await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
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
    const tokenVariants = this.getTokenLookupVariants(token);

    return await this.prisma.refreshToken.findFirst({
      where: {
        token: {
          in: tokenVariants,
        },
      },
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
    const tokenVariants = this.getTokenLookupVariants(token);

    const result = await this.prisma.refreshToken.updateMany({
      where: {
        token: {
          in: tokenVariants,
        },
      },
      data: { isRevoked: true },
    });

    return result.count > 0;
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
    const tokenVariants = this.getTokenLookupVariants(token);

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        token: {
          in: tokenVariants,
        },
      },
    });

    return result.count > 0;
  }

  /**
   * Consume a refresh token exactly once.
   *
   * This atomic update prevents the same token from being used twice in
   * concurrent refresh requests.
   */
  async consumeRefreshToken(token: string): Promise<boolean> {
    const tokenVariants = this.getTokenLookupVariants(token);

    const result = await this.prisma.refreshToken.updateMany({
      where: {
        token: {
          in: tokenVariants,
        },
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        isRevoked: true,
      },
    });

    return result.count === 1;
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
