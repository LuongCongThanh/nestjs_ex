import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function testDatabaseConnection(): Promise<void> {
  const logger = new Logger('TestDbConnection');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    await prisma.$connect();
    logger.log('Database connection established successfully');

    const result = await prisma.$queryRaw<{ test: number }[]>
      `SELECT 1 as test`;
    const [{ test }] = result ?? [{ test: 0 }];
    logger.log(`Test query returned: ${test}`);

    await prisma.$disconnect();
    await app.close();
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, error.stack);
    } else {
      logger.error('Database connection test failed', String(error));
    }
    process.exit(1);
  }
}

void testDatabaseConnection();
