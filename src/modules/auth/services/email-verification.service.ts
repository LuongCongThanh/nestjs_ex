import { Injectable, Logger } from '@nestjs/common';
import { EmailVerificationToken } from '@prisma/client';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * EmailVerificationService
 *
 * Purpose: Manage email verification token lifecycle
 */
@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new email verification token
   */
  async createVerificationToken(userId: string): Promise<string> {
    const plainToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.prisma.emailVerificationToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt,
        isUsed: false,
      },
    });

    this.logger.log(`Email verification token created for user ${userId}`);

    return plainToken;
  }

  /**
   * Validate email verification token
   */
  async validateToken(plainToken: string): Promise<EmailVerificationToken | null> {
    const hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    const verificationToken = await this.prisma.emailVerificationToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!verificationToken) {
      this.logger.warn(`Verification token not found`);
      return null;
    }

    if (verificationToken.expiresAt < new Date()) {
      this.logger.warn(`Verification token expired for user ${verificationToken.userId}`);
      return null;
    }

    if (verificationToken.isUsed) {
      this.logger.warn(`Verification token already used for user ${verificationToken.userId}`);
      return null;
    }

    return verificationToken;
  }

  /**
   * Mark verification token as used
   */
  async markAsUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { id },
      data: { isUsed: true },
    });

    this.logger.log(`Verification token ${id} marked as used`);
  }

  /**
   * Delete old expired and used tokens (cleanup job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const expiredResult = await this.prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const usedResult = await this.prisma.emailVerificationToken.deleteMany({
      where: {
        isUsed: true,
        createdAt: { lt: sevenDaysAgo },
      },
    });

    const totalDeleted = expiredResult.count + usedResult.count;
    this.logger.log(`Cleaned up ${totalDeleted} email verification tokens`);

    return totalDeleted;
  }

  /**
   * Revoke all verification tokens for a user
   */
  async revokeUserTokens(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, isUsed: false },
      data: { isUsed: true },
    });

    this.logger.log(`All verification tokens revoked for user ${userId}`);
  }
}
