// Structured-output JSON schema for one chat turn, plus input bounds.
//
// The model returns a conversational `reply` AND the per-turn analysis in a
// single structured response. The schema follows the structured-output rules:
// additionalProperties: false, every property required, $defs for the reused
// trigger shape, and no unsupported constraints (no min/max). Ranges are
// validated defensively on our side.

import { INTERVENTION_IDS } from './interventions.js';

// Per-message bound (characters); also the request-history cap.
export const INPUT_MAX_CHARS = 4000;
export const INPUT_MIN_CHARS = 1;
// How many prior messages to load as model context (keeps token spend bounded).
export const HISTORY_LIMIT = 30;

// The model may pick an intervention id, or 'none' when no exercise fits this turn.
export const CHAT_INTERVENTION_IDS = [...INTERVENTION_IDS, 'none'];

export const TRIGGER_CATEGORIES = [
  'peer_comparison',
  'parental_pressure',
  'time_pressure',
  'self_doubt',
  'performance',
  'sleep_fatigue',
  'future_uncertainty',
  'other',
];

export const DISTORTION_TYPES = [
  'none',
  'catastrophizing',
  'all_or_nothing',
  'overgeneralization',
  'mind_reading',
  'fortune_telling',
  'labeling',
];

export const CRISIS_SEVERITIES = ['none', 'low', 'high'];

export const CHAT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  $defs: {
    trigger: {
      type: 'object',
      additionalProperties: false,
      properties: {
        label: {
          type: 'string',
          description: 'Short human-readable trigger, e.g. "mock rank comparison".',
        },
        category: { type: 'string', enum: TRIGGER_CATEGORIES },
      },
      required: ['label', 'category'],
    },
  },
  properties: {
    reply: {
      type: 'string',
      description:
        'Your warm, conversational reply to the student, usually 1–4 sentences. Ask a gentle follow-up question when it feels natural. No clinical jargon, no platitudes, no bullet lists unless genuinely helpful.',
    },
    emotion: {
      type: 'string',
      description: 'The single dominant emotion you sense in their latest message, or "neutral".',
    },
    intensity: {
      type: 'integer',
      description: 'Estimated emotional intensity from 0 (calm) to 100 (overwhelming).',
    },
    triggers: {
      type: 'array',
      description: 'Specific stress triggers present in the latest message. Empty if none are clear.',
      items: { $ref: '#/$defs/trigger' },
    },
    distortion: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: DISTORTION_TYPES },
        quote: {
          type: 'string',
          description: 'The exact phrase showing the distortion, or "" when type is none.',
        },
      },
      required: ['type', 'quote'],
    },
    suggested_intervention: {
      type: 'string',
      enum: CHAT_INTERVENTION_IDS,
      description:
        'An evidence-based exercise id to offer this turn, or "none" when no exercise fits. Suggest one only when the moment genuinely calls for it — not every turn.',
    },
    crisis: {
      type: 'object',
      additionalProperties: false,
      properties: {
        flag: { type: 'boolean' },
        severity: { type: 'string', enum: CRISIS_SEVERITIES },
      },
      required: ['flag', 'severity'],
    },
  },
  required: ['reply', 'emotion', 'intensity', 'triggers', 'distortion', 'suggested_intervention', 'crisis'],
};
