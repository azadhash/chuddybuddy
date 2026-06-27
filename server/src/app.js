// Express app factory. Exported separately from server startup so tests can
// inject a MemoryStore + mocked Anthropic client and bind no port.

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { createAuthRouter } from './routes/auth.js';
import { createChatRouter } from './routes/chat.js';
import { createRateLimiter } from './rateLimit.js';
import { HELPLINES } from './helplines.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.resolve(__dirname, '../../web/dist');

export function createApp({ anthropic, store, rateLimiter } = {}) {
  if (!anthropic) throw new Error('createApp requires an injected `anthropic` client.');
  if (!store) throw new Error('createApp requires an injected `store`.');

  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '16kb' }));

  // Chat spends tokens; auth endpoints are brute-force targets. Rate-limit both.
  const chatLimiter = rateLimiter ?? createRateLimiter({ windowMs: 60_000, max: 20 });
  const authLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/helplines', (_req, res) => res.json({ helplines: HELPLINES }));

  app.use('/api/auth', createAuthRouter({ store, rateLimiter: authLimiter }));
  app.use('/api/chat', createChatRouter({ store, anthropic, rateLimiter: chatLimiter }));

  // Catch malformed JSON bodies with a clean 400.
  app.use((err, _req, res, next) => {
    if (err?.type === 'entity.parse.failed' || err?.statusCode === 400) {
      return res.status(400).json({ error: 'Invalid request body.' });
    }
    return next(err);
  });

  // Serve the built frontend in production (single deployable service).
  if (fs.existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST));
    app.get('*', (_req, res) => res.sendFile(path.join(WEB_DIST, 'index.html')));
  }

  return app;
}
