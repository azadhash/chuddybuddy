import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalForm from '../src/components/JournalForm.jsx';

describe('JournalForm', () => {
  it('associates a real label with the textarea (accessible name present)', () => {
    render(<JournalForm onSubmit={() => {}} loading={false} error="" />);
    // getByLabelText only succeeds if the control has an accessible name.
    const field = screen.getByLabelText(/how are you feeling/i);
    expect(field.tagName).toBe('TEXTAREA');
  });

  it('disables submit until there is non-empty text', async () => {
    const user = userEvent.setup();
    render(<JournalForm onSubmit={() => {}} loading={false} error="" />);
    const button = screen.getByRole('button', { name: /reflect with anchor/i });
    expect(button).toBeDisabled();

    await user.type(screen.getByLabelText(/how are you feeling/i), 'feeling stressed');
    expect(button).toBeEnabled();
  });

  it('submits the trimmed entry', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<JournalForm onSubmit={onSubmit} loading={false} error="" />);

    await user.type(screen.getByLabelText(/how are you feeling/i), '  exam tomorrow  ');
    await user.click(screen.getByRole('button', { name: /reflect with anchor/i }));

    expect(onSubmit).toHaveBeenCalledWith('exam tomorrow');
  });

  it('announces errors via role="alert"', () => {
    render(<JournalForm onSubmit={() => {}} loading={false} error="Something went wrong." />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong.');
  });

  it('announces loading via role="status"', () => {
    render(<JournalForm onSubmit={() => {}} loading error="" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
