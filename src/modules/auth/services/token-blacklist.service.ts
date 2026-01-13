import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { TokenBlacklist } from '../entities/token-blacklist.entity';

/**
 * Token Blacklist Service
 * Manages revoked/blacklisted JWT tokens
 */
@Injectable()
export class TokenBlacklistService {
  constructor(
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
  ) {}

  /**
   * Add token to blacklist
   */
  async addToBlacklist(token: string, userId: string, reason: string, expiresAt: Date): Promise<void> {
    const blacklistedToken = this.tokenBlacklistRepository.create({
      token,
      userId,
      reason,
      expiresAt,
    });

    await this.tokenBlacklistRepository.save(blacklistedToken);
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const found = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });

    return !!found;
  }

  /**
   * Clean up expired tokens (run periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.tokenBlacklistRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeUserTokens(userId: string, reason: string): Promise<void> {
    // This would typically be implemented with a cache or database query
    // to invalidate all active sessions for a user
    // Implementation depends on your token storage strategy
  }
}
