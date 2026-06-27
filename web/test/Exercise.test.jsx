import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Exercise from '../src/components/Exercise.jsx';

const stepExercise = {
  id: 'thought_record',
  title: '7-column thought record',
  forWhat: 'all-or-nothing thoughts',
  durationMinutes: 8,
  steps: ['Name the situation', 'Write the thought', 'Re-rate the emotion'],
  whyItWorks: 'Targets the worry component.',
  citation: 'Ergene, T. (2003).',
};

const breathingExercise = {
  id: 'physiological_sigh',
  title: 'Physiological sigh',
  forWhat: 'acute panic',
  durationMinutes: 1,
  steps: ['Inhale', 'Sip', 'Exhale'],
  whyItWorks: 'Slows the breath.',
  citation: 'Balban et al. (2023).',
  breathing: {
    cycles: 3,
    phases: [
      { label: 'Breathe in', seconds: 4, scale: 0.85 },
      { label: 'A little more', seconds: 2, scale: 1 },
      { label: 'Slow exhale', seconds: 6, scale: 0.45 },
    ],
  },
};

describe('Exercise', () => {
  it('shows the overview with a Start button by default', () => {
    render(<Exercise intervention={stepExercise} />);
    expect(screen.getByRole('heading', { name: /thought record/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start guided/i })).toBeInTheDocument();
  });

  it('renders nothing without an intervention', () => {
    const { container } = render(<Exercise intervention={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('walks a reflective exercise one step at a time to completion', () => {
    render(<Exercise intervention={stepExercise} />);
    fireEvent.click(screen.getByRole('button', { name: /start guided/i }));

    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('Name the situation')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Write the thought')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('Re-rate the emotion')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /finish/i }));
    expect(screen.getByText(/nicely done/i)).toBeInTheDocument();
  });

  it('runs the animated breathing guide through its timed phases', () => {
    vi.useFakeTimers();
    try {
      render(<Exercise intervention={breathingExercise} />);
      fireEvent.click(screen.getByRole('button', { name: /start guided/i }));

      expect(screen.getByText('Breathe in')).toBeInTheDocument();
      expect(screen.getByText(/cycle 1 of 3/i)).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(4000)); // first phase (4s) elapses
      expect(screen.getByText('A little more')).toBeInTheDocument();

      act(() => vi.advanceTimersByTime(2000)); // second phase (2s) elapses
      expect(screen.getByText('Slow exhale')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
