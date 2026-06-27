// Structured-output JSON schema for the entry analysis, plus input bounds.
//
// The schema follows the structured-output rules: additionalProperties: false,
// every property required, $defs/$ref for reused shapes, and no unsupported
// constraints (no min/max on numbers, no min/max length on strings/arrays).
// We validate ranges (e.g. intensity 0–100) defensively on our side instead.

import { INTERVENTION_IDS } from './interventions.js';

// Maximum accepted journal entry length (characters). Bounds request size and
// token spend; entries longer than this are rejected with a 400.
export const INPUT_MAX_CHARS = 4000;
export const INPUT_MIN_CHARS = 1;

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

export const ANALYSIS_SCHEMA = {
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
    reflection: {
      type: 'string',
      description:
        'One or two warm, specific sentences reflecting back what the student is feeling. No platitudes, no advice here, no clinical language.',
    },
    primary_emotion: {
      type: 'string',
      description: 'A single dominant emotion word, e.g. "overwhelmed", "anxious", "discouraged".',
    },
    intensity: {
      type: 'integer',
      description: 'Estimated emotional intensity from 0 (calm) to 100 (overwhelming).',
    },
    triggers: {
      type: 'array',
      description: 'Specific stress triggers detected in the text. Empty if none are clear.',
      items: { $ref: '#/$defs/trigger' },
    },
    distortion: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: DISTORTION_TYPES },
        quote: {
          type: 'string',
          description: 'The exact phrase from the entry that shows the distortion, or "" if type is none.',
        },
      },
      required: ['type', 'quote'],
    },
    recommended_intervention: {
      type: 'string',
      enum: INTERVENTION_IDS,
      description: 'The single best-matched evidence-based exercise id for this entry.',
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
  required: [
    'reflection',
    'primary_emotion',
    'intensity',
    'triggers',
    'distortion',
    'recommended_intervention',
    'crisis',
  ],
};
