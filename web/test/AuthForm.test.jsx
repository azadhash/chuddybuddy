import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../src/lib/api.js', () => ({ login: vi.fn(), register: vi.fn() }));
import { login } from '../src/lib/api.js';
import AuthForm from '../src/components/AuthForm.jsx';

beforeEach(() => vi.clearAllMocks());

describe('AuthForm', () => {
  it('has labelled email and password fields', () => {
    render(<AuthForm onAuthed={() => {}} />);
    expect(screen.getByLabelText(/email/i).tagName).toBe('INPUT');
    expect(screen.getByLabelText(/password/i).tagName).toBe('INPUT');
  });

  it('logs in and hands the user up on success', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ email: 'a@b.com' });
    const onAuthed = vi.fn();
    render(<AuthForm onAuthed={onAuthed} />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'supersecret');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(login).toHaveBeenCalledWith('a@b.com', 'supersecret');
    expect(onAuthed).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('announces an error via role="alert"', async () => {
    const user = userEvent.setup();
    login.mockRejectedValue(new Error('Invalid email or password.'));
    render(<AuthForm onAuthed={() => {}} />);

    await user.type(screen.getByLabelText(/email/i), 'a@b.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/invalid email or password/i);
  });

  it('switches to register mode', async () => {
    const user = userEvent.setup();
    render(<AuthForm onAuthed={() => {}} />);
    await user.click(screen.getByRole('button', { name: /create an account/i }));
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });
});
