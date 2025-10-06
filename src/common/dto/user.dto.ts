import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User as PrismaUser } from '@prisma/client';
import { DEFAULT_USER_ROLES, Role } from '../constants/roles.constant';

export type SanitizedUser = Omit<PrismaUser, 'password' | 'roles'> & {
  roles: Role[];
};

export class UserResponseDto implements SanitizedUser {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Jane Doe' })
  fullName!: string;

  @ApiProperty({ example: 'jane.doe@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: '+84901234567', nullable: true })
  phone!: string | null;

  @ApiProperty({ example: false })
  isEmailVerified!: boolean;

  @ApiProperty({ example: ['user'] })
  roles!: Role[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-02T00:00:00.000Z' })
  updatedAt!: Date;
}

export function toUserResponse(user: PrismaUser): UserResponseDto {
  const { password: _password, roles, ...rest } = user;
  void _password;
  return {
    ...rest,
    roles: (roles?.length ? roles : DEFAULT_USER_ROLES) as Role[],
  };
}
