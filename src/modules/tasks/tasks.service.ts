import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    const now = new Date();

    const [blacklist, refresh, emailVerif] = await Promise.all([
      this.prisma.tokenBlacklist.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } }),
      this.prisma.emailVerification.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: now } },
            { isUsed: true, createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
      }),
    ]);

    this.logger.log(
      `Token cleanup: blacklist=${blacklist.count}, refreshTokens=${refresh.count}, emailVerifications=${emailVerif.count}`,
    );
  }
}
