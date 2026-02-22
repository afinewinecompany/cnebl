import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Default</Badge>);

    const badge = screen.getByText('Default');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-charcoal');
  });

  it('renders different variants', () => {
    const variants = [
      { variant: 'primary' as const, expectedClass: 'bg-navy' },
      { variant: 'secondary' as const, expectedClass: 'bg-gray-200' },
      { variant: 'success' as const, expectedClass: 'bg-field' },
      { variant: 'warning' as const, expectedClass: 'bg-gold' },
      { variant: 'danger' as const, expectedClass: 'bg-cardinal' },
      { variant: 'outline' as const, expectedClass: 'border-2' },
    ];

    variants.forEach(({ variant, expectedClass }) => {
      const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
      expect(screen.getByText(variant)).toHaveClass(expectedClass);
      unmount();
    });
  });

  it('renders medal variants', () => {
    const { rerender } = render(<Badge variant="gold">1st</Badge>);
    expect(screen.getByText('1st')).toHaveClass('bg-gold');
    expect(screen.getByText('1st')).toHaveClass('uppercase');

    rerender(<Badge variant="silver">2nd</Badge>);
    expect(screen.getByText('2nd')).toHaveClass('bg-gray-300');

    rerender(<Badge variant="bronze">3rd</Badge>);
    expect(screen.getByText('3rd')).toHaveClass('bg-amber-600');
  });

  it('renders live variant with animation', () => {
    render(<Badge variant="live">LIVE</Badge>);

    const badge = screen.getByText('LIVE');
    expect(badge).toHaveClass('bg-cardinal');
    expect(badge).toHaveClass('animate-pulse');
    expect(badge).toHaveClass('uppercase');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('px-2');
    expect(screen.getByText('Small')).toHaveClass('text-[10px]');

    rerender(<Badge size="default">Default</Badge>);
    expect(screen.getByText('Default')).toHaveClass('px-3');
    expect(screen.getByText('Default')).toHaveClass('text-xs');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('px-4');
    expect(screen.getByText('Large')).toHaveClass('text-sm');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);

    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('renders with rounded-full style', () => {
    render(<Badge>Rounded</Badge>);

    expect(screen.getByText('Rounded')).toHaveClass('rounded-full');
  });

  it('passes through additional HTML attributes', () => {
    render(
      <Badge data-testid="test-badge" id="my-badge">
        Test
      </Badge>
    );

    const badge = screen.getByTestId('test-badge');
    expect(badge).toHaveAttribute('id', 'my-badge');
  });
});
