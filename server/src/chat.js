// Conversational analysis pipeline. Pure and Express-free: the store and the
// Anthropic client are injected so it is unit-testable with no DB, key, or
// network.
//
// Per turn: validate + bound the new message -> deterministic crisis scan ->
// load the user's recent history from the store -> ONE structured model call
// (conversational reply + per-turn analysis) -> merge crisis -> persist the user
// and assistant messages -> return the assistant turn.

import { crisisScan } from './markers.js';
import { getIntervention } from './interventions.js';
import { HELPLINES } from './helplines.js';
import { ValidationError } from './errors.js';
import { CHAT_SCHEMA, INPUT_MAX_CHARS, INPUT_MIN_CHARS, HISTORY_LIMIT } from './schema.js';

export const MODEL = 'claude-haiku-4-5';

const SYSTEM_PROMPT = [
  'You are Anchor, a warm, evidence-based wellness companion for students preparing for high-stakes exams (NEET, JEE, CUET, CAT, GATE, UPSC, board exams).',
  'You are having an ongoing chat with the student. Reply like a caring, grounded friend who happens to understand the psychology of exam stress — be specific and human, never preachy or clinical, and never diagnose. Ask gentle follow-up questions to understand what is really going on.',
  'Alongside your reply, quietly analyse the latest message: the dominant emotion and its intensity, any specific stress triggers, and any cognitive distortion (with the exact quote).',
  'Offer an exercise via suggested_intervention only when the moment genuinely fits — otherwise use "none". Match it to the need:',
  '- thought_record for catastrophic or all-or-nothing thoughts about the exam,',
  '- physiological_sigh for acute panic or a racing heart,',
  '- self_compassion_break for harsh self-criticism after a setback,',
  '- if_then_plan for procrastination or trouble starting study,',
  '- worry_dump when an exam or mock is imminent.',
  'You are a supportive companion, not a therapist. Set crisis.flag true and severity high only if the message suggests self-harm or that life is not worth living; otherwise none or low.',
].join('\n');

export function validateMessage(message) {
  if (typeof message !== 'string') {
    throw new ValidationError('Message must be a string.');
  }
  const trimmed = message.trim();
  if (trimmed.length < INPUT_MIN_CHARS) {
    throw new ValidationError('Message must not be empty.');
  }
  if (message.length > INPUT_MAX_CHARS) {
    throw new ValidationError(`Message must be ${INPUT_MAX_CHARS} characters or fewer.`);
  }
  return trimmed;
}

function clampIntensity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function mergeCrisis(markerCrisis, modelCrisis) {
  if (markerCrisis.flagged) {
    return { flag: true, severity: 'high', source: 'keyword' };
  }
  const flag = Boolean(modelCrisis?.flag);
  const severity = flag ? modelCrisis.severity ?? 'low' : 'none';
  return { flag, severity, source: flag ? 'model' : 'none' };
}

// Run one chat turn for a user. `store` and `anthropic` are injected.
export async function chatTurn({ userId, message, store, anthropic }) {
  const text = validateMessage(message);
  const markerCrisis = crisisScan(text);

  const history = await store.listMessages(userId, HISTORY_LIMIT);
  const modelMessages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: text },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: CHAT_SCHEMA } },
    messages: modelMessages,
  });

  const textBlock = response?.content?.find((b) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('Model returned no reply.');
  }
  const model = JSON.parse(textBlock.text);

  const crisis = mergeCrisis(markerCrisis, model.crisis);
  const intensity = clampIntensity(model.intensity);
  const triggers = Array.isArray(model.triggers) ? model.triggers : [];
  const distortion = model.distortion ?? { type: 'none', quote: '' };
  const interventionId =
    model.suggested_intervention && model.suggested_intervention !== 'none'
      ? model.suggested_intervention
      : null;
  const intervention = interventionId ? getIntervention(interventionId) : null;

  // Compact insight persisted on the assistant row (drives the timeline).
  const insight = {
    emotion: model.emotion,
    intensity,
    triggers,
    distortion,
    interventionId,
    crisis: { flag: crisis.flag, severity: crisis.severity },
  };

  // Persist the turn (user message, then assistant reply with its insight).
  await store.addMessage({ userId, role: 'user', content: text });
  await store.addMessage({ userId, role: 'assistant', content: model.reply, insight });

  return {
    reply: model.reply,
    emotion: model.emotion,
    intensity,
    triggers,
    distortion,
    intervention,
    crisis,
    helplines: crisis.flag ? HELPLINES : [],
  };
}
