// Core analysis pipeline — pure and Express-free so it is unit-testable and the
// Anthropic client can be injected/mocked (no real key or network in tests).
//
// Flow: validate + bound -> deterministic markers (no API) -> one model call
// (structured JSON) -> merge. The crisis path is decided by the union of a local
// keyword scan and the model's own judgement, favouring false positives.

import { computeMarkers } from './markers.js';
import { getIntervention } from './interventions.js';
import { HELPLINES } from './helplines.js';
import {
  ANALYSIS_SCHEMA,
  INPUT_MAX_CHARS,
  INPUT_MIN_CHARS,
} from './schema.js';

export const MODEL = 'claude-haiku-4-5';

// Thrown for bad user input; the route maps it to a 400 without leaking internals.
export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}

const SYSTEM_PROMPT = [
  'You are Anchor, a warm, evidence-based wellness companion for students preparing for high-stakes exams (NEET, JEE, CUET, CAT, GATE, UPSC, board exams).',
  'You read a short journal entry and return a structured analysis that helps the student see what is going on beneath the surface.',
  'Be empathetic and specific, never preachy or clinical. You are a supportive companion, not a therapist, and you never diagnose.',
  'Pick the single recommended_intervention that best fits the entry:',
  '- thought_record for catastrophic or all-or-nothing thoughts about the exam,',
  '- physiological_sigh for acute panic or a racing heart,',
  '- self_compassion_break for harsh self-criticism after a setback,',
  '- if_then_plan for procrastination or trouble starting study,',
  '- worry_dump when an exam or mock is imminent.',
  'For crisis: set flag true and severity high only if the entry suggests self-harm or that life is not worth living. Otherwise severity none or low.',
].join('\n');

// Validate and normalize raw input. Returns the trimmed entry string or throws.
export function validateEntry(entry) {
  if (typeof entry !== 'string') {
    throw new ValidationError('Entry must be a string.');
  }
  const trimmed = entry.trim();
  if (trimmed.length < INPUT_MIN_CHARS) {
    throw new ValidationError('Entry must not be empty.');
  }
  if (entry.length > INPUT_MAX_CHARS) {
    throw new ValidationError(`Entry must be ${INPUT_MAX_CHARS} characters or fewer.`);
  }
  return trimmed;
}

function clampIntensity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Decide the final crisis state from the union of the local scan and the model.
// The deterministic keyword scan is a strong signal — if it fires, escalate hard.
function mergeCrisis(markerCrisis, modelCrisis) {
  if (markerCrisis.flagged) {
    return { flag: true, severity: 'high', source: 'keyword' };
  }
  const flag = Boolean(modelCrisis?.flag);
  const severity = flag ? modelCrisis.severity ?? 'low' : 'none';
  return { flag, severity, source: flag ? 'model' : 'none' };
}

// Run the full analysis for one journal entry.
// `anthropic` must expose `messages.create(...)` (the real SDK client or a mock).
export async function analyzeEntry(rawEntry, { anthropic }) {
  const entry = validateEntry(rawEntry);
  const markers = computeMarkers(entry);

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
    messages: [{ role: 'user', content: entry }],
  });

  const textBlock = response?.content?.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('Model returned no analysis.');
  }

  // Structured output guarantees the first text block is valid JSON — parse it directly.
  const model = JSON.parse(textBlock.text);

  const crisis = mergeCrisis(markers.crisis, model.crisis);
  const intervention = getIntervention(model.recommended_intervention);

  return {
    reflection: model.reflection,
    primaryEmotion: model.primary_emotion,
    intensity: clampIntensity(model.intensity),
    triggers: Array.isArray(model.triggers) ? model.triggers : [],
    distortion: model.distortion ?? { type: 'none', quote: '' },
    intervention,
    crisis,
    // Surface helplines with the payload whenever crisis is flagged.
    helplines: crisis.flag ? HELPLINES : [],
    markers: {
      wordCount: markers.wordCount,
      absolutistDensity: markers.absolutistDensity,
      firstPersonRatio: markers.firstPersonRatio,
    },
  };
}
