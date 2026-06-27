// Auth guard. Reads the session cookie; on a valid token sets req.userId and
// continues, otherwise responds 401.

import { readSessionUserId } from './session.js';

export function requireAuth(req, res, next) {
  const userId = readSessionUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Please sign in to continue.' });
  }
  req.userId = userId;
  return next();
}
