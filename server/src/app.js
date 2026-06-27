// Express app factory. Exported separately from server startup so tests can
// import the app with a mocked Anthropic client and without binding a port.

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { analyzeEntry, ValidationError } from './analyze.js';
import { createRateLimiter } from './rateLimit.js';
import { HELPLINES } from './helplines.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST = path.resolve(__dirname, '../../web/dist');

export function createApp({ anthropic, rateLimiter } = {}) {
  if (!anthropic) {
    throw new Error('createApp requires an injected `anthropic` client.');
  }

  const app = express();
  app.set('trust proxy', true);

  // Bound the request body well above the input cap but small enough to reject abuse.
  app.use(express.json({ limit: '16kb' }));

  const limiter = rateLimiter ?? createRateLimiter();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Always-available helplines, so the UI can show support regardless of analysis.
  app.get('/api/helplines', (_req, res) => {
    res.json({ helplines: HELPLINES });
  });

  app.post('/api/analyze', limiter, async (req, res) => {
    try {
      const result = await analyzeEntry(req.body?.entry, { anthropic });
      res.json(result);
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
      }
      // Log internals server-side; never leak them to the client.
      console.error('[analyze] failed:', err);
      return res
        .status(500)
        .json({ error: 'Something went wrong analyzing your entry. Please try again.' });
    }
  });

  // Catch malformed JSON bodies (and other body-parser errors) with a clean 400.
  app.use((err, _req, res, next) => {
    if (err?.type === 'entity.parse.failed' || err?.statusCode === 400) {
      return res.status(400).json({ error: 'Invalid request body.' });
    }
    return next(err);
  });

  // Serve the built frontend in production (single deployable service).
  if (fs.existsSync(WEB_DIST)) {
    app.use(express.static(WEB_DIST));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(WEB_DIST, 'index.html'));
    });
  }

  return app;
}
