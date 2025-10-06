export const ROLE_USER = 'user' as const;
export const ROLE_ADMIN = 'admin' as const;

export type Role = typeof ROLE_USER | typeof ROLE_ADMIN;

export const DEFAULT_USER_ROLES: Role[] = [ROLE_USER];
