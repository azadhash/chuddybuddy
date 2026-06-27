import { describe, it, expect } from 'vitest';
import { analyzeEntry, validateEntry, ValidationError } from '../src/analyze.js';
import { INPUT_MAX_CHARS } from '../src/schema.js';
import { mockAnthropic, sampleAnalysis } from './helpers.js';

describe('validateEntry', () => {
  it('rejects non-strings', () => {
    expect(() => validateEntry(null)).toThrow(ValidationError);
    expect(() => validateEntry(123)).toThrow(ValidationError);
  });

  it('rejects empty / whitespace-only entries', () => {
    expect(() => validateEntry('   ')).toThrow(ValidationError);
  });

  it('rejects entries over the length cap', () => {
    expect(() => validateEntry('a'.repeat(INPUT_MAX_CHARS + 1))).toThrow(ValidationError);
  });

  it('returns the trimmed entry when valid', () => {
    expect(validateEntry('  hello  ')).toBe('hello');
  });
});

describe('analyzeEntry', () => {
  it('returns a merged result with the canonical intervention attached', async () => {
    const anthropic = mockAnthropic(sampleAnalysis());
    const result = await analyzeEntry('Another mock, my rank dropped again.', { anthropic });

    expect(result.reflection).toMatch(/peers/);
    expect(result.primaryEmotion).toBe('anxious');
    expect(result.intensity).toBe(72);
    expect(result.triggers[0].category).toBe('peer_comparison');

    // The server attaches fixed, cited exercise content for the chosen id.
    expect(result.intervention.id).toBe('thought_record');
    expect(result.intervention.citation).toMatch(/Ergene/);
    expect(result.intervention.steps.length).toBeGreaterThan(0);

    expect(result.crisis.flag).toBe(false);
    expect(result.helplines).toEqual([]);
    expect(result.markers.wordCount).toBeGreaterThan(0);
  });

  it('clamps intensity into 0..100', async () => {
    const anthropic = mockAnthropic(sampleAnalysis({ intensity: 250 }));
    const result = await analyzeEntry('overwhelmed', { anthropic });
    expect(result.intensity).toBe(100);
  });

  it('escalates crisis from the local keyword scan even when the model says none', async () => {
    const anthropic = mockAnthropic(sampleAnalysis({ crisis: { flag: false, severity: 'none' } }));
    const result = await analyzeEntry('I want to die, there is no point in living', { anthropic });

    expect(result.crisis.flag).toBe(true);
    expect(result.crisis.severity).toBe('high');
    expect(result.crisis.source).toBe('keyword');
    expect(result.helplines.length).toBeGreaterThan(0);
  });

  it('respects a model-flagged crisis and attaches helplines', async () => {
    const anthropic = mockAnthropic(sampleAnalysis({ crisis: { flag: true, severity: 'high' } }));
    const result = await analyzeEntry('Everything feels hopeless and pointless', { anthropic });

    expect(result.crisis.flag).toBe(true);
    expect(result.crisis.source).toBe('model');
    expect(result.helplines.length).toBeGreaterThan(0);
  });

  it('propagates validation errors before calling the model', async () => {
    const anthropic = mockAnthropic(sampleAnalysis());
    await expect(analyzeEntry('   ', { anthropic })).rejects.toBeInstanceOf(ValidationError);
  });
});
