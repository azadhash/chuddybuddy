import { describe, it, expect } from 'vitest';
import {
  tokenize,
  absolutistDensity,
  firstPersonRatio,
  crisisScan,
  computeMarkers,
} from '../src/markers.js';

describe('tokenize', () => {
  it('lowercases and splits into word tokens', () => {
    expect(tokenize("I'm Always tired.")).toEqual(["i'm", 'always', 'tired']);
  });

  it('returns [] for non-strings', () => {
    expect(tokenize(null)).toEqual([]);
    expect(tokenize(42)).toEqual([]);
  });
});

describe('absolutistDensity', () => {
  it('is 0 for empty text', () => {
    expect(absolutistDensity('')).toBe(0);
  });

  it('counts absolutist words as a ratio of tokens', () => {
    // "I will never ever pass" -> 5 tokens, 2 absolutist (never, ever)
    expect(absolutistDensity('I will never ever pass')).toBeCloseTo(2 / 5);
  });
});

describe('firstPersonRatio', () => {
  it('counts first-person-singular pronouns as a ratio', () => {
    // "i hate my life" -> 4 tokens, 2 first-person (i, my)
    expect(firstPersonRatio('i hate my life')).toBeCloseTo(2 / 4);
  });
});

describe('crisisScan', () => {
  it('does not flag ordinary stress', () => {
    const r = crisisScan('I am so stressed about the exam tomorrow');
    expect(r.flagged).toBe(false);
    expect(r.matches).toEqual([]);
  });

  it('flags explicit self-harm language', () => {
    const r = crisisScan('Sometimes I just want to die, there is no point in living');
    expect(r.flagged).toBe(true);
    expect(r.matches.length).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    expect(crisisScan('I want to KILL MYSELF').flagged).toBe(true);
  });
});

describe('computeMarkers', () => {
  it('bundles every marker', () => {
    const m = computeMarkers('I always feel like I will never be enough');
    expect(m.wordCount).toBeGreaterThan(0);
    expect(m.absolutistDensity).toBeGreaterThan(0);
    expect(m.firstPersonRatio).toBeGreaterThan(0);
    expect(m.crisis.flagged).toBe(false);
  });
});
