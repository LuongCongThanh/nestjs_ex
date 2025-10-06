import { Role } from 'src/common/constants/roles.constant';

export interface JwtPayload {
  sub: number;
  email: string;
  roles: Role[];
}
