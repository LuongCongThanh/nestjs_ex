import { Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PasswordService } from './services/password.service';

@Module({
  providers: [PasswordService, JwtAuthGuard, RolesGuard],
  exports: [PasswordService, JwtAuthGuard, RolesGuard],
})
export class CommonModule {}
