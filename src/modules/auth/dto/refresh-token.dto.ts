import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for refresh token requests.
 */
export class RefreshTokenDto {
  /** The active refresh token string. */
  @ApiProperty({ example: '7c8d9e...' })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
