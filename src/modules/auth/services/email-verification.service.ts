import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'node:crypto';
import { LessThan, Repository } from 'typeorm';
import { EmailVerificationToken } from '../entities/email-verification-token.entity';

/**
 * EmailVerificationService
 *
 * Purpose: Manage email verification token lifecycle
 *
 * Responsibilities:
 * - Generate secure verification tokens
 * - Store hashed tokens in database
 * - Validate tokens (check expiry, usage)
 * - Mark tokens as used after verification
 * - Cleanup expired/used tokens
 *
 * Security Features:
 * - Tokens are 64-char hex strings (32 bytes crypto-secure random)
 * - Tokens are hashed with SHA-256 before database storage
 * - Tokens expire after 24 hours
 * - Single-use only (isUsed flag)
 */
@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly emailVerificationTokenRepository: Repository<EmailVerificationToken>,
  ) {}

  /**
   * Create a new email verification token
   *
   * Flow:
   * 1. Generate secure random token (32 bytes = 64 hex chars)
   * 2. Hash token with SHA-256 for database storage
   * 3. Set expiration (24 hours from now)
   * 4. Save to database
   * 5. Return plain token (to send via email)
   *
   * @param userId - User ID to associate token with
   * @returns Plain token (unhashed) to send in email link
   *
   * @example
   * const token = await service.createVerificationToken(user.id);
   * // Send email with: https://app.com/verify-email?token={token}
   */
  async createVerificationToken(userId: string): Promise<string> {
    // Generate secure random token (32 bytes = 64 hex characters)
    const plainToken = crypto.randomBytes(32).toString('hex');

    // Hash token with SHA-256 before storing in database
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    // Calculate expiration (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create token entity
    const verificationToken = this.emailVerificationTokenRepository.create({
      token: hashedToken,
      userId,
      expiresAt,
      isUsed: false,
    });

    // Save to database
    await this.emailVerificationTokenRepository.save(verificationToken);

    this.logger.log(`Email verification token created for user ${userId}`);

    // Return plain token (unhashed) to send via email
    return plainToken;
  }

  /**
   * Validate email verification token
   *
   * Checks:
   * 1. Token exists in database (after hashing)
   * 2. Token has not expired
   * 3. Token has not been used already
   *
   * @param plainToken - Plain token from email link (not hashed)
   * @returns EmailVerificationToken with user relation, or null if invalid
   *
   * @example
   * const token = await service.validateToken(plainTokenFromQuery);
   * if (!token) throw new BadRequestException('Invalid token');
   */
  async validateToken(plainToken: string): Promise<EmailVerificationToken | null> {
    // Hash the plain token to match database storage
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    // Find token in database with user relation
    const verificationToken = await this.emailVerificationTokenRepository.findOne({
      where: { token: hashedToken },
      relations: ['user'],
    });

    if (!verificationToken) {
      this.logger.warn(`Verification token not found`);
      return null;
    }

    // Check if token has expired
    if (verificationToken.expiresAt < new Date()) {
      this.logger.warn(`Verification token expired for user ${verificationToken.userId}`);
      return null;
    }

    // Check if token has been used
    if (verificationToken.isUsed) {
      this.logger.warn(`Verification token already used for user ${verificationToken.userId}`);
      return null;
    }

    return verificationToken;
  }

  /**
   * Mark verification token as used
   *
   * Called after successful email verification to prevent token reuse
   *
   * @param tokenId - Token entity ID
   */
  async markAsUsed(tokenId: string): Promise<void> {
    await this.emailVerificationTokenRepository.update(tokenId, {
      isUsed: true,
    });

    this.logger.log(`Verification token ${tokenId} marked as used`);
  }

  /**
   * Delete old expired and used tokens (cleanup job)
   *
   * Should be called by a cron job daily
   * Deletes:
   * - Expired tokens (expiresAt < now)
   * - Used tokens older than 7 days
   *
   * @returns Number of deleted tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    // Delete expired tokens
    const expiredResult = await this.emailVerificationTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    // Delete used tokens older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usedResult = await this.emailVerificationTokenRepository.delete({
      isUsed: true,
      createdAt: LessThan(sevenDaysAgo),
    });

    const totalDeleted = (expiredResult.affected || 0) + (usedResult.affected || 0);

    this.logger.log(`Cleaned up ${totalDeleted} email verification tokens`);

    return totalDeleted;
  }

  /**
   * Revoke all verification tokens for a user
   *
   * Useful when:
   * - User requests new verification email (invalidate old tokens)
   * - User changes email address
   *
   * @param userId - User ID
   */
  async revokeUserTokens(userId: string): Promise<void> {
    await this.emailVerificationTokenRepository.update(
      { userId, isUsed: false },
      { isUsed: true }, // Mark as used to effectively revoke
    );

    this.logger.log(`All verification tokens revoked for user ${userId}`);
  }
}
