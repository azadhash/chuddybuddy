import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DoctorReport from '../src/components/DoctorReport.jsx';

// Dated "now" so the entries fall inside the default (last 7 days) range.
function todayMessages() {
  const now = new Date().toISOString();
  return [
    { id: 1, role: 'user', content: 'rank dropped again', createdAt: now },
    {
      id: 2,
      role: 'assistant',
      content: 'reply',
      createdAt: now,
      emotion: 'anxious',
      intensity: 60,
      triggers: [{ label: 'rank', category: 'peer_comparison' }],
      distortion: { type: 'all_or_nothing', quote: 'never' },
    },
  ];
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DoctorReport', () => {
  it('has labelled From and To date pickers', () => {
    render(<DoctorReport messages={[]} />);
    expect(screen.getByLabelText('From')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('To')).toHaveAttribute('type', 'date');
  });

  it('shows an empty state for a range with no check-ins', () => {
    render(<DoctorReport messages={[]} />);
    expect(screen.getByText(/no check-ins in this range/i)).toBeInTheDocument();
  });

  it('summarises the real check-ins in range', () => {
    render(<DoctorReport messages={todayMessages()} />);
    expect(screen.getByRole('heading', { name: /summary ·/i })).toBeInTheDocument();
    expect(screen.getByText(/peer comparison \(1\)/i)).toBeInTheDocument();
  });

  it('copies the summary to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<DoctorReport messages={todayMessages()} email="a@b.com" />);
    fireEvent.click(screen.getByRole('button', { name: /copy summary/i }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(writeText.mock.calls[0][0]).toMatch(/ANCHOR — WELLNESS SUMMARY/);
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument();
  });
});
