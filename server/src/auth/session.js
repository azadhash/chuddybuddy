// Stateless sessions via a signed, httpOnly cookie. No JWT library: the token is
// `userId.expiry.HMAC-SHA256(userId.expiry)` signed with SESSION_SECRET and
// verified with a constant-time compare. The cookie is HttpOnly (not readable by
// JS, so XSS can't steal it), SameSite=Lax, and Secure in production.

import { createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_NAME = 'anchor_session';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET is not set.');
  return s;
}

function sign(data) {
  return createHmac('sha256', secret()).update(data).digest('base64url');
}

export function signToken(userId, now = Date.now()) {
  const expiry = now + MAX_AGE_MS;
  const data = `${userId}.${expiry}`;
  return `${data}.${sign(data)}`;
}

// Returns the userId (number) for a valid, unexpired token, else null.
export function verifyToken(token, now = Date.now()) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiry, sig] = parts;
  const data = `${userId}.${expiry}`;
  const expected = sign(data);

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (!/^\d+$/.test(expiry) || Number(expiry) < now) return null;
  if (!/^\d+$/.test(userId)) return null;
  return Number(userId);
}

export function setSessionCookie(res, userId) {
  res.cookie(COOKIE_NAME, signToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_MS,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

// Minimal cookie-header parse so we don't need a cookie-parser dependency.
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

export function readSessionUserId(req) {
  const cookies = parseCookies(req.headers?.cookie);
  return verifyToken(cookies[COOKIE_NAME]);
}
