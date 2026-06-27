// Password hashing with Node's built-in scrypt — no native dependency (bcrypt)
// to build on Render. Each password gets a random 16-byte salt; the stored value
// is "salt:hash" (both hex). Verification is constant-time via timingSafeEqual.

import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scryptAsync(plain, salt, KEYLEN);
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(plain, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hashHex] = stored.split(':');
  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scryptAsync(plain, salt, KEYLEN);
  // Lengths must match for timingSafeEqual; guard so a malformed hash can't throw.
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}
