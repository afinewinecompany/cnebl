import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card', () => {
  it('renders with default variant', () => {
    render(<Card data-testid="card">Content</Card>);

    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('bg-ivory');
    expect(card).toHaveClass('border');
  });

  it('renders different variants', () => {
    const { rerender } = render(
      <Card data-testid="card" variant="elevated">
        Elevated
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('shadow-md');

    rerender(
      <Card data-testid="card" variant="outlined">
        Outlined
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('border-2');

    rerender(
      <Card data-testid="card" variant="ghost">
        Ghost
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('bg-transparent');

    rerender(
      <Card data-testid="card" variant="interactive">
        Interactive
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('cursor-pointer');
  });

  it('renders different padding sizes', () => {
    const { rerender } = render(
      <Card data-testid="card" padding="sm">
        Small
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-4');

    rerender(
      <Card data-testid="card" padding="default">
        Default
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-6');

    rerender(
      <Card data-testid="card" padding="lg">
        Large
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('p-8');
  });

  it('applies custom className', () => {
    render(
      <Card data-testid="card" className="custom-class">
        Custom
      </Card>
    );
    expect(screen.getByTestId('card')).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('renders with default styles', () => {
    render(<CardHeader data-testid="header">Header</CardHeader>);

    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('p-6');
  });

  it('applies custom className', () => {
    render(
      <CardHeader data-testid="header" className="custom">
        Header
      </CardHeader>
    );
    expect(screen.getByTestId('header')).toHaveClass('custom');
  });
});

describe('CardTitle', () => {
  it('renders as h3 element', () => {
    render(<CardTitle>Title</CardTitle>);

    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Title');
  });

  it('applies typography styles', () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);

    const title = screen.getByTestId('title');
    expect(title).toHaveClass('font-headline');
    expect(title).toHaveClass('text-navy');
  });
});

describe('CardDescription', () => {
  it('renders paragraph element', () => {
    render(<CardDescription>Description text</CardDescription>);

    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('applies muted text styles', () => {
    render(
      <CardDescription data-testid="desc">Description</CardDescription>
    );

    expect(screen.getByTestId('desc')).toHaveClass('text-charcoal-light');
  });
});

describe('CardContent', () => {
  it('renders with default styles', () => {
    render(<CardContent data-testid="content">Content</CardContent>);

    const content = screen.getByTestId('content');
    expect(content).toHaveClass('p-6');
    expect(content).toHaveClass('pt-0');
  });
});

describe('CardFooter', () => {
  it('renders with flex layout', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);

    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
  });
});

describe('Card composition', () => {
  it('renders complete card with all parts', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Card</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>Main content here</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>
    );

    expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Main content here')).toBeInTheDocument();
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });
});
