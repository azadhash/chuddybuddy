import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Journal from '../src/components/Journal.jsx';

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
    { id: 3, role: 'user', content: 'parents will be upset', createdAt: '2026-06-26T10:00:00Z' },
    {
      id: 4,
      role: 'assistant',
      content: 'reply2',
      createdAt: '2026-06-26T10:00:05Z',
      emotion: 'worried',
      intensity: 80,
      triggers: [],
      distortion: { type: 'fortune_telling', quote: 'upset' },
    },
  ];
}

describe('Journal', () => {
  it('shows an empty state until the user has written', () => {
    render(<Journal messages={[]} />);
    expect(screen.getByText(/journal is empty/i)).toBeInTheDocument();
  });

  it('shows the real entries with how each was read', () => {
    render(<Journal messages={sampleMessages()} />);
    expect(screen.getByText('rank dropped again')).toBeInTheDocument();
    expect(screen.getByText('parents will be upset')).toBeInTheDocument();
    // Each entry is badged with the detected emotion + intensity.
    expect(screen.getByText(/anxious · 60\/100/i)).toBeInTheDocument();
    expect(screen.getByText(/worried · 80\/100/i)).toBeInTheDocument();
  });

  it('groups entries under a day section', () => {
    render(<Journal messages={sampleMessages()} />);
    // Two distinct days → two labelled day regions.
    const days = screen.getAllByRole('region', { name: /entries for/i });
    expect(days).toHaveLength(2);
  });
});
