import { describe, it, expect } from 'vitest';
import {
  entriesFrom,
  journalDays,
  dailyMood,
  summary,
  topTriggers,
  topDistortions,
} from '../src/lib/insights.js';

// Two check-ins on two consecutive days, each followed by an assistant analysis.
function sampleMessages() {
  return [
    { id: 1, role: 'user', content: 'rank dropped again', createdAt: '2026-06-25T09:00:00Z' },
    {
      id: 2,
      role: 'assistant',
      content: 'That comparison is exhausting.',
      createdAt: '2026-06-25T09:00:05Z',
      emotion: 'anxious',
      intensity: 60,
      triggers: [{ label: 'rank', category: 'peer_comparison' }],
      distortion: { type: 'all_or_nothing', quote: 'never catch up' },
    },
    { id: 3, role: 'user', content: 'parents will be disappointed', createdAt: '2026-06-26T10:00:00Z' },
    {
      id: 4,
      role: 'assistant',
      content: 'You are carrying a lot.',
      createdAt: '2026-06-26T10:00:05Z',
      emotion: 'anxious',
      intensity: 80,
      triggers: [{ label: 'parents', category: 'parental_pressure' }],
      distortion: { type: 'fortune_telling', quote: 'will be disappointed' },
    },
  ];
}

describe('entriesFrom', () => {
  it('pairs each user check-in with the following assistant analysis', () => {
    const entries = entriesFrom(sampleMessages());
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ text: 'rank dropped again', emotion: 'anxious', intensity: 60 });
  });

  it('skips optimistic messages that have no timestamp yet', () => {
    const entries = entriesFrom([{ id: 9, role: 'user', content: 'just typed' }]);
    expect(entries).toHaveLength(0);
  });
});

describe('journalDays', () => {
  it('groups entries by calendar day, most recent first', () => {
    const days = journalDays(sampleMessages());
    expect(days).toHaveLength(2);
    expect(days[0].key > days[1].key).toBe(true); // newest first
    expect(days[0].entries).toHaveLength(1);
    expect(days[0].avgIntensity).toBe(80);
    expect(days[0].dominantEmotion).toBe('anxious');
  });
});

describe('dailyMood', () => {
  it('returns days oldest-first for plotting', () => {
    const mood = dailyMood(sampleMessages());
    expect(mood.map((d) => d.avgIntensity)).toEqual([60, 80]);
  });
});

describe('summary', () => {
  it('counts check-ins, active days, the streak, and the average intensity', () => {
    expect(summary(sampleMessages())).toEqual({
      totalCheckins: 2,
      daysActive: 2,
      avgIntensity: 70,
      streak: 2,
    });
  });

  it('is all zeros with no history', () => {
    expect(summary([])).toEqual({ totalCheckins: 0, daysActive: 0, avgIntensity: 0, streak: 0 });
  });
});

describe('top patterns', () => {
  it('ranks triggers and thinking patterns by frequency', () => {
    expect(topTriggers(sampleMessages())).toHaveLength(2);
    const distortions = topDistortions(sampleMessages());
    expect(distortions).toHaveLength(2);
    expect(distortions.every((d) => d.count === 1)).toBe(true);
  });

  it('ignores the "none" distortion', () => {
    const msgs = [
      { id: 1, role: 'user', content: 'hi', createdAt: '2026-06-26T10:00:00Z' },
      { id: 2, role: 'assistant', content: 'hello', createdAt: '2026-06-26T10:00:01Z', distortion: { type: 'none', quote: '' } },
    ];
    expect(topDistortions(msgs)).toHaveLength(0);
  });
});
