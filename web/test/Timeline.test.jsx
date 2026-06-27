import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Timeline from '../src/components/Timeline.jsx';

function entry(id, category, intensity) {
  return {
    id,
    at: new Date().toISOString(),
    primaryEmotion: 'anxious',
    intensity,
    triggers: [{ label: 'rank', category }],
    interventionId: 'thought_record',
  };
}

describe('Timeline', () => {
  it('shows an empty state when there are no entries', () => {
    render(<Timeline entries={[]} />);
    expect(screen.getByText(/patterns will appear here/i)).toBeInTheDocument();
  });

  it('calls out a recurring trigger across recent entries', () => {
    const entries = [
      entry('1', 'peer_comparison', 60),
      entry('2', 'peer_comparison', 70),
      entry('3', 'time_pressure', 50),
      entry('4', 'peer_comparison', 80),
    ];
    render(<Timeline entries={entries} />);
    // Peer comparison appears in 3 of the last 4 -> recurrence callout.
    expect(screen.getByText(/recurring trigger/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Peer comparison/).length).toBeGreaterThan(0);
  });

  it('does not over-claim a pattern from a single entry', () => {
    render(<Timeline entries={[entry('1', 'self_doubt', 40)]} />);
    expect(screen.queryByText(/recurring trigger/i)).not.toBeInTheDocument();
  });
});
