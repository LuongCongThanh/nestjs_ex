import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string; // user id (UUID)
  email: string; // user email
  role: UserRole;
  iat?: number;
  exp?: number;
}
