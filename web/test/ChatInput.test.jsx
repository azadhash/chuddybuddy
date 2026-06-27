import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '../src/components/ChatInput.jsx';

describe('ChatInput', () => {
  it('has a real label for the message field', () => {
    render(<ChatInput onSend={() => {}} loading={false} />);
    expect(screen.getByLabelText(/your message to anchor/i).tagName).toBe('TEXTAREA');
  });

  it('disables send until there is text', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={() => {}} loading={false} />);
    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();
    await user.type(screen.getByLabelText(/your message/i), 'hello');
    expect(button).toBeEnabled();
  });

  it('sends the trimmed message and clears the field', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} loading={false} />);
    const field = screen.getByLabelText(/your message/i);
    await user.type(field, '  hi there  ');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(onSend).toHaveBeenCalledWith('hi there');
    expect(field).toHaveValue('');
  });

  it('sends on Enter (without shift)', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} loading={false} />);
    await user.type(screen.getByLabelText(/your message/i), 'quick note{Enter}');
    expect(onSend).toHaveBeenCalledWith('quick note');
  });

  it('keeps focus in the field after sending so typing can continue', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={() => {}} loading={false} />);
    const field = screen.getByLabelText(/your message/i);
    await user.type(field, 'hello');
    await user.click(screen.getByRole('button', { name: /send/i }));
    expect(field).toHaveFocus();
  });
});
