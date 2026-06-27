import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../src/lib/api.js', () => ({
  me: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getHistory: vi.fn(),
  chat: vi.fn(),
}));
import { me, logout, getHistory, chat } from '../src/lib/api.js';
import App from '../src/App.jsx';

function assistantTurn(overrides = {}) {
  return {
    reply: 'That comparison with your peers sounds exhausting.',
    emotion: 'anxious',
    intensity: 68,
    triggers: [{ label: 'mock rank comparison', category: 'peer_comparison' }],
    distortion: { type: 'all_or_nothing', quote: "I'll never catch up" },
    intervention: {
      id: 'thought_record',
      title: '7-column thought record',
      forWhat: 'all-or-nothing thoughts',
      durationMinutes: 8,
      steps: ['Name the situation'],
      whyItWorks: 'Targets worry.',
      citation: 'Ergene, T. (2003).',
    },
    crisis: { flag: false, severity: 'none' },
    helplines: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getHistory.mockResolvedValue({ messages: [] });
});

describe('App', () => {
  it('always renders exactly one h1', async () => {
    me.mockResolvedValue(null);
    render(<App />);
    await screen.findByRole('heading', { level: 2, name: /welcome back/i });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('shows the auth form when not signed in', async () => {
    me.mockResolvedValue(null);
    render(<App />);
    expect(await screen.findByLabelText(/email/i)).toBeInTheDocument();
  });

  it('offers a skip link to the main content', async () => {
    me.mockResolvedValue(null);
    render(<App />);
    await screen.findByLabelText(/email/i);
    const skip = screen.getByRole('link', { name: /skip to main content/i });
    expect(skip).toHaveAttribute('href', '#main');
  });

  it('shows the chat by default when signed in', async () => {
    me.mockResolvedValue({ email: 'a@b.com' });
    render(<App />);
    expect(await screen.findByRole('heading', { name: /talk it through/i })).toBeInTheDocument();
  });

  it('switches to the Insights tab and shows the dashboard + journal empty states', async () => {
    const user = userEvent.setup();
    me.mockResolvedValue({ email: 'a@b.com' });
    render(<App />);

    await screen.findByRole('heading', { name: /talk it through/i });
    await user.click(screen.getByRole('button', { name: /insights/i }));

    expect(await screen.findByRole('heading', { name: /your dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/dashboard will fill in/i)).toBeInTheDocument();
    expect(screen.getByText(/journal is empty/i)).toBeInTheDocument();
  });

  it('opens the Share tab with the doctor summary', async () => {
    const user = userEvent.setup();
    me.mockResolvedValue({ email: 'a@b.com' });
    render(<App />);

    await screen.findByRole('heading', { name: /talk it through/i });
    await user.click(screen.getByRole('button', { name: /share/i }));

    expect(
      await screen.findByRole('heading', { name: /share with your doctor/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('From')).toBeInTheDocument();
  });

  it('sends a message and renders the reply + matched exercise', async () => {
    const user = userEvent.setup();
    me.mockResolvedValue({ email: 'a@b.com' });
    chat.mockResolvedValue(assistantTurn());
    render(<App />);

    await screen.findByRole('heading', { name: /talk it through/i });
    await user.type(screen.getByLabelText(/your message to anchor/i), 'rank dropped again');
    await user.click(screen.getByRole('button', { name: /send/i }));

    expect(await screen.findByText(/comparison with your peers/i)).toBeInTheDocument();
    expect(screen.getByText('7-column thought record')).toBeInTheDocument();
  });

  it('shows the crisis panel with a helpline on a crisis turn', async () => {
    const user = userEvent.setup();
    me.mockResolvedValue({ email: 'a@b.com' });
    chat.mockResolvedValue(
      assistantTurn({
        crisis: { flag: true, severity: 'high' },
        helplines: [{ name: 'Tele-MANAS', org: 'Govt · 24×7', number: '14416', url: '#' }],
      }),
    );
    render(<App />);

    await screen.findByRole('heading', { name: /talk it through/i });
    await user.type(screen.getByLabelText(/your message to anchor/i), 'I want to give up');
    await user.click(screen.getByRole('button', { name: /send/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/deserve support/i);
    expect(screen.getByRole('link', { name: /14416/ })).toBeInTheDocument();
  });

  it('signs out back to the auth form', async () => {
    const user = userEvent.setup();
    me.mockResolvedValue({ email: 'a@b.com' });
    logout.mockResolvedValue({ ok: true });
    render(<App />);

    await screen.findByRole('heading', { name: /talk it through/i });
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => expect(screen.getByLabelText(/email/i)).toBeInTheDocument());
  });
});
