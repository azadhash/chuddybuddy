import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Dashboard from '../src/components/Dashboard.jsx';

function sampleMessages() {
  return [
    { id: 1, role: 'user', content: 'rank dropped', createdAt: '2026-06-25T09:00:00Z' },
    {
      id: 2,
      role: 'assistant',
      content: 'reply',
      createdAt: '2026-06-25T09:00:05Z',
      emotion: 'anxious',
      intensity: 60,
      triggers: [{ label: 'rank', category: 'peer_comparison' }],
      distortion: { type: 'fortune_telling', quote: 'will fail' },
    },
  ];
}

describe('Dashboard', () => {
  it('shows a genuine empty state with no history', () => {
    render(<Dashboard messages={[]} />);
    expect(screen.getByText(/dashboard will fill in/i)).toBeInTheDocument();
  });

  it('renders the headline stats and the recurring thinking pattern', () => {
    render(<Dashboard messages={sampleMessages()} />);
    expect(screen.getByText(/check-ins/i)).toBeInTheDocument();
    expect(screen.getByText(/day streak/i)).toBeInTheDocument();
    expect(screen.getByText('Fortune telling')).toBeInTheDocument();
  });

  it('labels each day of the mood chart for screen readers', () => {
    render(<Dashboard messages={sampleMessages()} />);
    expect(
      screen.getByRole('img', { name: /average intensity 60 out of 100/i }),
    ).toBeInTheDocument();
  });
});
