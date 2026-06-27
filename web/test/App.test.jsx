import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the network layer so tests need no server or key.
vi.mock('../src/lib/api.js', () => ({ analyzeEntry: vi.fn() }));
import { analyzeEntry } from '../src/lib/api.js';
import App from '../src/App.jsx';

function nonCrisisResult() {
  return {
    reflection: 'It sounds like comparing ranks with your friends is wearing you down.',
    primaryEmotion: 'anxious',
    intensity: 68,
    triggers: [{ label: 'mock rank comparison', category: 'peer_comparison' }],
    distortion: { type: 'all_or_nothing', quote: "I'll never catch up" },
    intervention: {
      id: 'thought_record',
      title: '7-column thought record',
      forWhat: 'Catastrophic or all-or-nothing thoughts',
      durationMinutes: 8,
      steps: ['Name the situation'],
      whyItWorks: 'Targets the worry component.',
      citation: 'Ergene, T. (2003).',
    },
    crisis: { flag: false, severity: 'none', source: 'none' },
    helplines: [],
    markers: { wordCount: 10, absolutistDensity: 0.1, firstPersonRatio: 0.2 },
  };
}

function crisisResult() {
  return {
    ...nonCrisisResult(),
    crisis: { flag: true, severity: 'high', source: 'keyword' },
    helplines: [{ name: 'Tele-MANAS', org: 'Govt · 24×7', number: '14416', url: '#' }],
  };
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('App', () => {
  it('has exactly one h1', () => {
    render(<App />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows an empty-state timeline before any entry', () => {
    render(<App />);
    expect(screen.getByText(/patterns will appear here/i)).toBeInTheDocument();
  });

  it('renders the analysis and matched exercise after submitting', async () => {
    const user = userEvent.setup();
    analyzeEntry.mockResolvedValue(nonCrisisResult());
    render(<App />);

    await user.type(screen.getByLabelText(/how are you feeling/i), 'rank dropped again');
    await user.click(screen.getByRole('button', { name: /reflect with anchor/i }));

    expect(await screen.findByText(/comparing ranks/i)).toBeInTheDocument();
    expect(screen.getByText('7-column thought record')).toBeInTheDocument();
    expect(screen.getByText(/Ergene/)).toBeInTheDocument();
  });

  it('shows the crisis panel with a helpline when crisis is flagged', async () => {
    const user = userEvent.setup();
    analyzeEntry.mockResolvedValue(crisisResult());
    render(<App />);

    await user.type(screen.getByLabelText(/how are you feeling/i), 'I want to give up on everything');
    await user.click(screen.getByRole('button', { name: /reflect with anchor/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/deserve support/i);
    expect(screen.getByRole('link', { name: /14416/ })).toBeInTheDocument();
  });

  it('surfaces an error message when the request fails', async () => {
    const user = userEvent.setup();
    analyzeEntry.mockRejectedValue(new Error('Could not reach the server.'));
    render(<App />);

    await user.type(screen.getByLabelText(/how are you feeling/i), 'stressed about NEET');
    await user.click(screen.getByRole('button', { name: /reflect with anchor/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not reach the server/i);
  });
});
