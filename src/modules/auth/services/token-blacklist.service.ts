import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Token Blacklist Service
 * Manages revoked/blacklisted JWT tokens
 */
@Injectable()
export class TokenBlacklistService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add token to blacklist
   */
  async addToBlacklist(token: string, userId: string, reason: string, expiresAt: Date): Promise<void> {
    await this.prisma.tokenBlacklist.create({
      data: {
        token,
        userId,
        reason,
        expiresAt,
      },
    });
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const found = await this.prisma.tokenBlacklist.findUnique({
      where: { token },
    });

    return !!found;
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.tokenBlacklist.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeUserTokens(userId: string, reason: string): Promise<void> {
    // Optional: Implementation for user-wide revocation
  }
}
