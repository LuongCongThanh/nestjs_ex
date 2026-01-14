import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validationSchema } from './config/env.validation';
import { getTypeOrmConfig } from './config/typeorm.config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Config Module - Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}`, // Specific environment
        '.env', // Fallback
      ],
      validationSchema,
      validationOptions: {
        abortEarly: true, // Stop on first error
      },
    }),

    // TypeORM Module - Database connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
    }),

    // Health Check Module
    HealthModule,

    // Rate limiting (2026 requirement)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          limit: configService.get<number>('THROTTLE_LIMIT') || 100,
          ttl: configService.get<number>('THROTTLE_TTL') || 60,
        },
      ],
    }),

    // Feature Modules
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
