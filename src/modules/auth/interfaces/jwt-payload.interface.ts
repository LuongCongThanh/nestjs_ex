export interface JwtPayload {
  sub: string; // user id (UUID)
  email: string; // user email
  role: string;
  iat?: number;
  exp?: number;
}
