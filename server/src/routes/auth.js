// Auth routes: register, login, logout, me. Email/password only.

import express from 'express';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { setSessionCookie, clearSessionCookie, readSessionUserId } from '../auth/session.js';
import { ValidationError, AuthError, ConflictError } from '../errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 200;
const EMAIL_MAX = 254;

function normalizeEmail(email) {
  if (typeof email !== 'string') throw new ValidationError('Email is required.');
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.length > EMAIL_MAX || !EMAIL_RE.test(trimmed)) {
    throw new ValidationError('Please enter a valid email address.');
  }
  return trimmed;
}

function validatePassword(password) {
  if (typeof password !== 'string') throw new ValidationError('Password is required.');
  if (password.length < PASSWORD_MIN) {
    throw new ValidationError(`Password must be at least ${PASSWORD_MIN} characters.`);
  }
  if (password.length > PASSWORD_MAX) {
    throw new ValidationError('Password is too long.');
  }
  return password;
}

// Wrap an async handler so typed errors map to clean status codes and unexpected
// errors return a generic 500 without leaking internals.
function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof ValidationError || err instanceof AuthError || err instanceof ConflictError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      console.error('[auth] failed:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
}

export function createAuthRouter({ store, rateLimiter }) {
  const router = express.Router();
  const limit = rateLimiter ?? ((_req, _res, next) => next());

  router.post(
    '/register',
    limit,
    handle(async (req, res) => {
      const email = normalizeEmail(req.body?.email);
      const password = validatePassword(req.body?.password);

      if (await store.findUserByEmail(email)) {
        throw new ConflictError('An account with this email already exists.');
      }
      const passwordHash = await hashPassword(password);
      const user = await store.createUser({ email, passwordHash });
      setSessionCookie(res, user.id);
      res.status(201).json({ email: user.email });
    }),
  );

  router.post(
    '/login',
    limit,
    handle(async (req, res) => {
      const email = normalizeEmail(req.body?.email);
      const password = validatePassword(req.body?.password);

      const user = await store.findUserByEmail(email);
      // Generic message on both branches — no user enumeration.
      if (!user || !(await verifyPassword(password, user.password_hash))) {
        throw new AuthError('Invalid email or password.');
      }
      setSessionCookie(res, user.id);
      res.json({ email: user.email });
    }),
  );

  router.post(
    '/logout',
    handle(async (_req, res) => {
      clearSessionCookie(res);
      res.json({ ok: true });
    }),
  );

  router.get(
    '/me',
    handle(async (req, res) => {
      const userId = readSessionUserId(req);
      if (!userId) throw new AuthError();
      const user = await store.findUserById(userId);
      if (!user) throw new AuthError();
      res.json({ email: user.email });
    }),
  );

  return router;
}
