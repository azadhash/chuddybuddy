// Deterministic linguistic markers — computed locally, no API call.
//
// These are validated, research-grounded signals of distress that a scalar mood
// tracker cannot capture. They run before (and alongside) the model so the
// analysis is defensible ("we measure markers, we don't just ask the LLM") and
// so the crisis path can short-circuit without depending on the model.
//
//  - Absolutist-word density: Al-Mosaiwi & Johnstone (2018) found anxiety /
//    depression / suicidal-ideation forums use significantly more absolutist
//    words. We surface it gently as a trend, never as a diagnosis.
//  - First-person-singular ratio: Edwards & Holtzman (2017) meta-analysis links
//    elevated I/me/my use to depression (small effect, r ~= 0.13) — useful only
//    as an aggregate signal.

const ABSOLUTIST_WORDS = [
  'absolutely',
  'all',
  'always',
  'complete',
  'completely',
  'constant',
  'constantly',
  'definitely',
  'entire',
  'ever',
  'every',
  'everyone',
  'everything',
  'full',
  'must',
  'never',
  'nothing',
  'no one',
  'nobody',
  'none',
  'nowhere',
  'totally',
  'total',
  'whole',
];

const FIRST_PERSON_SINGULAR = ['i', 'me', 'my', 'mine', 'myself'];

// Tokenize into lowercase word tokens. Keeps apostrophes inside words ("i'm").
export function tokenize(text) {
  if (typeof text !== 'string') return [];
  const matches = text.toLowerCase().match(/[a-z']+/g);
  return matches ?? [];
}

// Share of tokens that are absolutist words, as a 0..1 ratio.
export function absolutistDensity(text) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;
  const set = new Set(ABSOLUTIST_WORDS);
  const hits = tokens.filter((t) => set.has(t)).length;
  return hits / tokens.length;
}

// Share of tokens that are first-person-singular pronouns, as a 0..1 ratio.
export function firstPersonRatio(text) {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;
  const set = new Set(FIRST_PERSON_SINGULAR);
  const hits = tokens.filter((t) => set.has(t)).length;
  return hits / tokens.length;
}

// Crisis phrases that warrant immediately surfacing human help. This is a
// deliberately conservative, recall-favoring scan: a responsible non-clinical
// tool should over-trigger rather than miss a disclosure (WHO LMM guidance).
// Matched as substrings on normalized text so light phrasing variation is caught.
const CRISIS_PHRASES = [
  'kill myself',
  'killing myself',
  'end my life',
  'ending my life',
  'want to die',
  'wanna die',
  'better off dead',
  'better off without me',
  'no reason to live',
  'no point in living',
  "don't want to be here",
  'do not want to be here',
  'take my own life',
  'suicide',
  'suicidal',
  'self harm',
  'self-harm',
  'hurt myself',
  'harming myself',
  'cut myself',
  "can't go on",
  'cannot go on',
  'end it all',
];

// Returns { flagged: boolean, matches: string[] }.
export function crisisScan(text) {
  if (typeof text !== 'string') return { flagged: false, matches: [] };
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');
  const matches = CRISIS_PHRASES.filter((phrase) => normalized.includes(phrase));
  return { flagged: matches.length > 0, matches };
}

// Bundle every deterministic marker for a piece of text.
export function computeMarkers(text) {
  return {
    wordCount: tokenize(text).length,
    absolutistDensity: absolutistDensity(text),
    firstPersonRatio: firstPersonRatio(text),
    crisis: crisisScan(text),
  };
}
