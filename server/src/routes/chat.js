// Chat routes (all require auth): fetch the user's history, and post a new turn.

import express from 'express';
import { requireAuth } from '../auth/middleware.js';
import { chatTurn } from './../chat.js';
import { getIntervention } from '../interventions.js';
import { HELPLINES } from '../helplines.js';
import { ValidationError } from '../errors.js';

// Map a stored message row to the shape the client renders. Assistant rows carry
// the per-turn insight; we resolve the intervention id back to the full exercise.
function mapMessage(m) {
  if (m.role !== 'assistant') {
    return { id: m.id, role: m.role, content: m.content, createdAt: m.created_at };
  }
  const insight = m.insight ?? {};
  const crisis = insight.crisis ?? { flag: false, severity: 'none' };
  return {
    id: m.id,
    role: 'assistant',
    content: m.content,
    createdAt: m.created_at,
    emotion: insight.emotion ?? 'neutral',
    intensity: insight.intensity ?? 0,
    triggers: insight.triggers ?? [],
    distortion: insight.distortion ?? { type: 'none', quote: '' },
    intervention: getIntervention(insight.interventionId),
    crisis,
    helplines: crisis.flag ? HELPLINES : [],
  };
}

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof ValidationError) {
        return res.status(400).json({ error: err.message });
      }
      console.error('[chat] failed:', err);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
}

export function createChatRouter({ store, anthropic, rateLimiter }) {
  const router = express.Router();
  const limit = rateLimiter ?? ((_req, _res, next) => next());

  router.get(
    '/history',
    requireAuth,
    handle(async (req, res) => {
      const messages = await store.listMessages(req.userId, 200);
      res.json({ messages: messages.map(mapMessage) });
    }),
  );

  router.post(
    '/',
    requireAuth,
    limit,
    handle(async (req, res) => {
      const result = await chatTurn({
        userId: req.userId,
        message: req.body?.message,
        store,
        anthropic,
      });
      res.json(result);
    }),
  );

  return router;
}
