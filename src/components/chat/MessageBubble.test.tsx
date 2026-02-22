import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { MessageBubble } from './MessageBubble';
import type { MessageWithAuthor } from './types';

// Sample message data
const createMessage = (overrides?: Partial<MessageWithAuthor>): MessageWithAuthor => ({
  id: 'msg-1',
  teamId: 'team-1',
  authorId: 'user-1',
  content: 'Hello, team!',
  replyToId: null,
  isPinned: false,
  isEdited: false,
  editedAt: null,
  isDeleted: false,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  author: {
    id: 'user-1',
    name: 'John Smith',
    role: 'player',
  },
  ...overrides,
});

describe('MessageBubble', () => {
  it('renders message content', () => {
    const message = createMessage();
    render(<MessageBubble message={message} />);

    expect(screen.getByText('Hello, team!')).toBeInTheDocument();
  });

  it('renders author name', () => {
    const message = createMessage();
    render(<MessageBubble message={message} />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('renders author initials in avatar', () => {
    const message = createMessage();
    render(<MessageBubble message={message} />);

    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    const message = createMessage();
    render(<MessageBubble message={message} />);

    // Should show "Today at HH:MM"
    expect(screen.getByText(/today at/i)).toBeInTheDocument();
  });

  it('shows role badge for manager', () => {
    const message = createMessage({
      author: { id: 'user-1', name: 'Jane Doe', role: 'manager' },
    });
    render(<MessageBubble message={message} />);

    expect(screen.getByText('manager')).toBeInTheDocument();
  });

  it('shows role badge for admin', () => {
    const message = createMessage({
      author: { id: 'user-1', name: 'Admin User', role: 'admin' },
    });
    render(<MessageBubble message={message} />);

    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('does not show role badge for player', () => {
    const message = createMessage({
      author: { id: 'user-1', name: 'Player User', role: 'player' },
    });
    render(<MessageBubble message={message} />);

    expect(screen.queryByText('player')).not.toBeInTheDocument();
  });

  it('shows pinned badge when isPinned is true', () => {
    const message = createMessage({ isPinned: true });
    render(<MessageBubble message={message} />);

    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('shows edited indicator when isEdited is true', () => {
    const message = createMessage({ isEdited: true });
    render(<MessageBubble message={message} />);

    expect(screen.getByText('(edited)')).toBeInTheDocument();
  });

  it('shows deleted message placeholder', () => {
    const message = createMessage({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });
    render(<MessageBubble message={message} />);

    expect(screen.getByText('[Message deleted]')).toBeInTheDocument();
    expect(screen.queryByText('Hello, team!')).not.toBeInTheDocument();
  });

  it('renders reply button when onReply provided', () => {
    const onReply = vi.fn();
    const message = createMessage();
    render(<MessageBubble message={message} onReply={onReply} />);

    expect(screen.getByLabelText(/reply to message/i)).toBeInTheDocument();
  });

  it('calls onReply when reply button clicked', async () => {
    const onReply = vi.fn();
    const message = createMessage();
    render(<MessageBubble message={message} onReply={onReply} />);

    screen.getByLabelText(/reply to message/i).click();
    expect(onReply).toHaveBeenCalledTimes(1);
  });

  it('renders pin button when onPin provided', () => {
    const onPin = vi.fn();
    const message = createMessage();
    render(<MessageBubble message={message} onPin={onPin} />);

    expect(screen.getByLabelText(/pin message/i)).toBeInTheDocument();
  });

  it('shows unpin label when message is pinned', () => {
    const onPin = vi.fn();
    const message = createMessage({ isPinned: true });
    render(<MessageBubble message={message} onPin={onPin} />);

    expect(screen.getByLabelText(/unpin message/i)).toBeInTheDocument();
  });

  it('renders edit button for own messages', () => {
    const onEdit = vi.fn();
    const message = createMessage();
    render(<MessageBubble message={message} isOwn onEdit={onEdit} />);

    expect(screen.getByLabelText(/edit message/i)).toBeInTheDocument();
  });

  it('does not render edit button for other users messages', () => {
    const onEdit = vi.fn();
    const message = createMessage();
    render(<MessageBubble message={message} isOwn={false} onEdit={onEdit} />);

    expect(screen.queryByLabelText(/edit message/i)).not.toBeInTheDocument();
  });

  it('renders delete button for own messages', () => {
    const onDelete = vi.fn();
    const message = createMessage();
    render(<MessageBubble message={message} isOwn onDelete={onDelete} />);

    expect(screen.getByLabelText(/delete message/i)).toBeInTheDocument();
  });

  it('hides action buttons when showActions is false', () => {
    const onReply = vi.fn();
    const message = createMessage();
    render(
      <MessageBubble message={message} onReply={onReply} showActions={false} />
    );

    expect(screen.queryByLabelText(/reply to message/i)).not.toBeInTheDocument();
  });

  it('hides action buttons for deleted messages', () => {
    const onReply = vi.fn();
    const message = createMessage({
      isDeleted: true,
      deletedAt: new Date().toISOString(),
    });
    render(<MessageBubble message={message} onReply={onReply} />);

    expect(screen.queryByLabelText(/reply to message/i)).not.toBeInTheDocument();
  });

  it('renders reply preview when replyTo is present', () => {
    const replyTo: MessageWithAuthor = createMessage({
      id: 'msg-0',
      content: 'Original message',
      author: { id: 'user-2', name: 'Jane Doe' },
    });
    const message = createMessage({
      replyToId: 'msg-0',
      replyTo,
    });
    render(<MessageBubble message={message} />);

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Original message')).toBeInTheDocument();
  });

  it('shows deleted placeholder in reply preview for deleted reply', () => {
    const replyTo: MessageWithAuthor = createMessage({
      id: 'msg-0',
      content: 'Original message',
      isDeleted: true,
      author: { id: 'user-2', name: 'Jane Doe' },
    });
    const message = createMessage({
      replyToId: 'msg-0',
      replyTo,
    });
    render(<MessageBubble message={message} />);

    expect(screen.getAllByText('[Message deleted]')).toHaveLength(1);
  });

  it('applies reply indentation when isReply is true', () => {
    const message = createMessage();
    const { container } = render(<MessageBubble message={message} isReply />);

    const wrapper = container.querySelector('[class*="ml-"]');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const message = createMessage();
    const { container } = render(
      <MessageBubble message={message} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
