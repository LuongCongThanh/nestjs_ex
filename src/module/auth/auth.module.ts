import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from 'src/module/auth/auth.controller';
import { AuthService } from 'src/module/auth/auth.service';
import { JwtAccessStrategy } from 'src/module/auth/strategies/jwt-access.strategy';
import { UsersModule } from 'src/module/users/users.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    UsersModule,
    PrismaModule,
    PassportModule,
    JwtModule.register({}), // options provided dynamically in service
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy],
  exports: [AuthService],
})
export class AuthModule {}
