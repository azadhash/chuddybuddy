import { describe, it, expect } from 'vitest';
import { summarizeRange } from '../src/lib/insights.js';
import { buildReportText } from '../src/lib/report.js';

function sampleMessages() {
  return [
    { id: 1, role: 'user', content: 'rank dropped again', createdAt: '2026-06-25T09:00:00Z' },
    {
      id: 2,
      role: 'assistant',
      content: 'reply',
      createdAt: '2026-06-25T09:00:05Z',
      emotion: 'anxious',
      intensity: 60,
      triggers: [{ label: 'rank', category: 'peer_comparison' }],
      distortion: { type: 'all_or_nothing', quote: 'never' },
    },
  ];
}

describe('buildReportText', () => {
  it('renders a shareable, non-diagnostic summary', () => {
    const report = summarizeRange(sampleMessages(), '2026-06-25', '2026-06-25');
    const text = buildReportText(report, { email: 'a@b.com' });

    expect(text).toMatch(/ANCHOR — WELLNESS SUMMARY/);
    expect(text).toMatch(/Period: 2026-06-25 to 2026-06-25/);
    expect(text).toMatch(/Check-ins: 1/);
    expect(text).toMatch(/Anxious \(1\)/);
    expect(text).toMatch(/Peer comparison \(1\)/);
    expect(text).toMatch(/not a diagnosis/i);
  });

  it('states clearly when there were no check-ins', () => {
    const report = summarizeRange([], '2026-06-01', '2026-06-07');
    const text = buildReportText(report);
    expect(text).toMatch(/No check-ins were recorded/i);
  });
});
