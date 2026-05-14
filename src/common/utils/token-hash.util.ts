import * as crypto from 'node:crypto';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getTokenLookupVariants(token: string): string[] {
  const hashed = hashToken(token);
  return hashed === token ? [token] : [token, hashed];
}
