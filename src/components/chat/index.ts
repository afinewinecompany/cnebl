/**
 * Chat Components
 *
 * Team chat UI components for the CNEBL application.
 * Built with the Heritage Diamond retro baseball theme.
 *
 * @example
 * import { TeamMessengerContainer, ChatContainer } from "@/components/chat";
 *
 * // Full messenger with channels
 * <TeamMessengerContainer
 *   teamId="rays"
 *   teamName="Rays"
 *   currentUserId={user.id}
 *   currentUserRole="player"
 * />
 *
 * // Simple chat container (no channels)
 * <ChatContainer
 *   teamName="Rays"
 *   messages={messages}
 *   currentUserId={user.id}
 *   onSendMessage={handleSend}
 * />
 */

// Main containers
export { TeamMessengerContainer } from "./TeamMessengerContainer";
export { ChatContainer } from "./ChatContainer";

// Sub-components
export { MessageList } from "./MessageList";
export { MessageBubble } from "./MessageBubble";
export { MessageInput } from "./MessageInput";
export { PinnedMessages } from "./PinnedMessages";

// Channel components
export { ChannelTabs } from "./channels/ChannelTabs";
export { ChannelBadge } from "./channels/ChannelBadge";
export { ChannelHeader } from "./channels/ChannelHeader";

// Types
export type { Message, Author, MessageWithAuthor } from "./types";
