import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { ChannelBadge } from './ChannelBadge';

describe('ChannelBadge', () => {
  it('renders count when greater than zero', () => {
    render(<ChannelBadge count={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not render when count is zero', () => {
    const { container } = render(<ChannelBadge count={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when count is negative', () => {
    const { container } = render(<ChannelBadge count={-1} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows 9+ when count exceeds 9', () => {
    render(<ChannelBadge count={15} />);

    expect(screen.getByText('9+')).toBeInTheDocument();
    expect(screen.queryByText('15')).not.toBeInTheDocument();
  });

  it('shows exactly 9 when count is 9', () => {
    render(<ChannelBadge count={9} />);

    expect(screen.getByText('9')).toBeInTheDocument();
  });

  it('applies default variant styling', () => {
    render(<ChannelBadge count={5} />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-navy');
  });

  it('applies important variant styling', () => {
    render(<ChannelBadge count={5} variant="important" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('bg-cardinal');
  });

  it('has correct aria-label for single message', () => {
    render(<ChannelBadge count={1} />);

    expect(screen.getByLabelText('1 unread message')).toBeInTheDocument();
  });

  it('has correct aria-label for multiple messages', () => {
    render(<ChannelBadge count={5} />);

    expect(screen.getByLabelText('5 unread messages')).toBeInTheDocument();
  });

  it('has status role for accessibility', () => {
    render(<ChannelBadge count={5} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ChannelBadge count={5} className="custom-class" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('custom-class');
  });
});
