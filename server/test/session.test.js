import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../src/auth/session.js';

describe('session tokens', () => {
  it('round-trips a userId through sign/verify', () => {
    const token = signToken(42);
    expect(verifyToken(token)).toBe(42);
  });

  it('rejects a tampered token', () => {
    const token = signToken(42);
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(verifyToken(tampered)).toBeNull();
  });

  it('rejects a token that swaps in a different userId', () => {
    const token = signToken(42);
    const [, expiry, sig] = token.split('.');
    const forged = `999.${expiry}.${sig}`;
    expect(verifyToken(forged)).toBeNull();
  });

  it('rejects an expired token', () => {
    const past = signToken(42, 0); // expiry computed from t=0, long past
    expect(verifyToken(past)).toBeNull();
  });

  it('rejects malformed input', () => {
    expect(verifyToken('nope')).toBeNull();
    expect(verifyToken(null)).toBeNull();
  });
});
