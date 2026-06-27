import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CrisisPanel from '../src/components/CrisisPanel.jsx';

const helplines = [
  { name: 'Tele-MANAS', org: 'Government of India · 24×7', number: '14416', url: '#' },
];

describe('CrisisPanel', () => {
  it('renders as an assertive alert region', () => {
    render(<CrisisPanel helplines={helplines} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('surfaces a callable helpline number', () => {
    render(<CrisisPanel helplines={helplines} />);
    const link = screen.getByRole('link', { name: /14416/ });
    expect(link).toHaveAttribute('href', 'tel:14416');
  });

  it('is transparent that it is an AI, not a therapist', () => {
    render(<CrisisPanel helplines={helplines} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/not a crisis service/i);
  });
});
