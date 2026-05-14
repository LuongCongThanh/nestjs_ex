import { hashToken, getTokenLookupVariants } from './token-hash.util';

describe('hashToken', () => {
  it('returns a hex string', () => {
    expect(hashToken('abc')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    expect(hashToken('same-token')).toBe(hashToken('same-token'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });
});

describe('getTokenLookupVariants', () => {
  it('returns both plain and hashed when input is not already a hash', () => {
    const token = 'raw-token-value';
    const variants = getTokenLookupVariants(token);
    expect(variants).toHaveLength(2);
    expect(variants).toContain(token);
    expect(variants).toContain(hashToken(token));
  });

  it('always includes both raw and hashed forms so DB can find either', () => {
    const token = 'any-token';
    const variants = getTokenLookupVariants(token);
    expect(variants).toHaveLength(2);
    expect(variants[0]).toBe(token);
    expect(variants[1]).toBe(hashToken(token));
  });
});
