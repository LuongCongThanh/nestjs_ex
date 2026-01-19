import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 *
 * This guard is responsible for protecting routes that require JWT Token authentication.
 * It checks the token in the 'Authorization: Bearer <token>' header.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
