/**
 * Chat Components
 *
 * Team chat UI components for the CNEBL application.
 * Built with the Heritage Diamond retro baseball theme.
 *
 * @example
 * import { ChatContainer } from "@/components/chat";
 *
 * <ChatContainer
 *   teamName="Rays"
 *   messages={messages}
 *   currentUserId={user.id}
 *   onSendMessage={handleSend}
 * />
 */

// Main container
export { ChatContainer } from "./ChatContainer";

// Sub-components
export { MessageList } from "./MessageList";
export { MessageBubble } from "./MessageBubble";
export { MessageInput } from "./MessageInput";
export { PinnedMessages } from "./PinnedMessages";

// Types
export type { Message, Author, MessageWithAuthor } from "./types";
