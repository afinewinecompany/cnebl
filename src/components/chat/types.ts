/**
 * Chat Component Types
 *
 * Shared TypeScript interfaces for the team chat feature
 */

export interface Message {
  id: string;
  teamId: string;
  authorId: string;
  content: string;
  replyToId: string | null;
  isPinned: boolean;
  isEdited: boolean;
  editedAt: string | null;
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
}

export interface Author {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: "player" | "manager" | "admin" | "commissioner";
}

export interface MessageWithAuthor extends Message {
  author: Author;
  replyTo?: MessageWithAuthor;
}
