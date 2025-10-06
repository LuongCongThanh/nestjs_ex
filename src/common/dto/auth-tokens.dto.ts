import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user.dto';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: () => UserResponseDto })
  user!: UserResponseDto;
}
