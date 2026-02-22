import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('renders with default state', () => {
    render(<Input placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('border-gray-200');
  });

  it('renders different input types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('shows error state when error prop is true', () => {
    render(<Input data-testid="input" error />);

    const input = screen.getByTestId('input');
    expect(input).toHaveClass('border-cardinal');
  });

  it('shows error state via state prop', () => {
    render(<Input data-testid="input" state="error" />);

    expect(screen.getByTestId('input')).toHaveClass('border-cardinal');
  });

  it('handles user input', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="input" />);

    const input = screen.getByTestId('input');
    await user.type(input, 'Hello World');

    expect(input).toHaveValue('Hello World');
  });

  it('calls onChange handler', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input data-testid="input" onChange={handleChange} />);

    await user.type(screen.getByTestId('input'), 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it('can be disabled', () => {
    render(<Input data-testid="input" disabled />);

    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50');
  });

  it('applies custom className', () => {
    render(<Input data-testid="input" className="custom-class" />);

    expect(screen.getByTestId('input')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);

    expect(ref).toHaveBeenCalled();
  });

  it('supports required attribute', () => {
    render(<Input data-testid="input" required />);

    expect(screen.getByTestId('input')).toBeRequired();
  });

  it('supports maxLength attribute', () => {
    render(<Input data-testid="input" maxLength={10} />);

    expect(screen.getByTestId('input')).toHaveAttribute('maxLength', '10');
  });

  it('supports autoComplete attribute', () => {
    render(<Input data-testid="input" autoComplete="email" />);

    expect(screen.getByTestId('input')).toHaveAttribute('autoComplete', 'email');
  });
});
