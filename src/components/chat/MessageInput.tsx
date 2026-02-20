"use client";

/**
 * MessageInput Component
 *
 * Chat input field with send button, character counter, and reply indicator.
 * Supports multiline input with auto-resize.
 *
 * @example
 * <MessageInput
 *   onSend={handleSendMessage}
 *   replyingTo={replyingToMessage}
 *   onCancelReply={() => setReplyingTo(null)}
 * />
 */

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Send, X, Reply, Pencil, Check } from "lucide-react";
import type { MessageWithAuthor } from "./types";

interface MessageInputProps {
  /** Callback when user sends a message */
  onSend: (content: string, replyToId?: string) => void;
  /** Message being replied to (shows reply indicator) */
  replyingTo?: MessageWithAuthor | null;
  /** Callback to cancel reply mode */
  onCancelReply?: () => void;
  /** Message being edited */
  editingMessage?: MessageWithAuthor | null;
  /** Callback when user submits an edit */
  onEdit?: (message: MessageWithAuthor, newContent: string) => void;
  /** Callback to cancel edit mode */
  onCancelEdit?: () => void;
  /** Maximum character limit */
  maxLength?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Whether sending is disabled (e.g., offline) */
  disabled?: boolean;
  /** Whether a message is currently being sent */
  isSending?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function MessageInput({
  onSend,
  replyingTo,
  onCancelReply,
  editingMessage,
  onEdit,
  onCancelEdit,
  maxLength = 500,
  placeholder = "Type a message...",
  disabled = false,
  isSending = false,
  className,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = !!editingMessage;

  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount >= maxLength * 0.9;
  const canSend = content.trim().length > 0 && !isOverLimit && !disabled && !isSending;

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get accurate scrollHeight
    textarea.style.height = "auto";
    // Set to scrollHeight, capped at max height (approx 5 lines)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, []);

  // Handle content changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // Adjust height when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  // Populate input and focus when editing
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
      // Move cursor to end of text
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.value.length;
          textareaRef.current.selectionEnd = textareaRef.current.value.length;
        }
      }, 0);
    }
  }, [editingMessage]);

  // Handle send (for new messages or edits)
  const handleSend = useCallback(() => {
    if (!canSend) return;

    if (isEditing && editingMessage && onEdit) {
      // Submit edit
      onEdit(editingMessage, content.trim());
    } else {
      // Send new message
      onSend(content.trim(), replyingTo?.id);
    }

    setContent("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [canSend, content, onSend, replyingTo?.id, isEditing, editingMessage, onEdit]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setContent("");
    onCancelEdit?.();
  }, [onCancelEdit]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift for newline)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Cancel edit on Escape
    if (e.key === "Escape" && isEditing && onCancelEdit) {
      handleCancelEdit();
      return;
    }

    // Cancel reply on Escape
    if (e.key === "Escape" && replyingTo && onCancelReply) {
      onCancelReply();
    }
  };

  return (
    <div className={cn("border-t border-cream-dark bg-cream", className)}>
      {/* Edit indicator */}
      <AnimatePresence>
        {isEditing && editingMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-cream-dark bg-gold/10 px-4 py-2">
              <Pencil className="h-4 w-4 text-gold-dark" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-charcoal-light">
                  Editing message
                </span>
                <p className="truncate text-xs text-charcoal-light">
                  {editingMessage.content}
                </p>
              </div>
              {onCancelEdit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCancelEdit}
                  aria-label="Cancel edit"
                  className="h-6 w-6 shrink-0 text-charcoal-light hover:text-charcoal"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply indicator */}
      <AnimatePresence>
        {replyingTo && !isEditing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-cream-dark bg-cream-light px-4 py-2">
              <Reply className="h-4 w-4 rotate-180 text-leather" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-charcoal-light">
                  Replying to{" "}
                  <span className="font-semibold text-navy">
                    {replyingTo.author.name}
                  </span>
                </span>
                <p className="truncate text-xs text-charcoal-light">
                  {replyingTo.isDeleted ? "[Message deleted]" : replyingTo.content}
                </p>
              </div>
              {onCancelReply && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCancelReply}
                  aria-label="Cancel reply"
                  className="h-6 w-6 shrink-0 text-charcoal-light hover:text-charcoal"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="px-4 py-3">
        <div
          className={cn(
            "flex items-end gap-3 rounded-lg border-2 bg-chalk px-3 py-2 transition-colors",
            disabled
              ? "border-gray-200 opacity-50"
              : isOverLimit
              ? "border-cardinal focus-within:border-cardinal"
              : "border-cream-dark focus-within:border-leather"
          )}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSending}
            rows={1}
            aria-label="Message input"
            aria-describedby="character-count"
            className={cn(
              "min-h-[40px] flex-1 resize-none bg-transparent font-body text-base text-charcoal",
              "placeholder:text-charcoal-light",
              "focus:outline-none",
              "disabled:cursor-not-allowed"
            )}
          />

          {/* Send/Save button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon-sm"
            className={cn(
              "shrink-0 transition-all h-11 w-11 active:scale-95",
              canSend
                ? isEditing
                  ? "bg-field text-chalk hover:bg-field/90"
                  : "bg-leather text-chalk hover:bg-leather-dark"
                : "bg-gray-200 text-charcoal-light"
            )}
            aria-label={isEditing ? "Save edit" : "Send message"}
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isEditing ? (
              <Check className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Footer: Character count and hints */}
        <div className="mt-2 flex items-center justify-between px-1">
          <p className="hidden sm:block text-xs text-charcoal-light">
            <kbd className="rounded bg-cream-dark px-1 py-0.5 font-mono text-[10px]">
              Enter
            </kbd>{" "}
            to send,{" "}
            <kbd className="rounded bg-cream-dark px-1 py-0.5 font-mono text-[10px]">
              Shift+Enter
            </kbd>{" "}
            for new line
          </p>

          <p
            id="character-count"
            className={cn(
              "font-mono text-xs transition-colors ml-auto",
              isOverLimit
                ? "font-semibold text-cardinal"
                : isNearLimit
                ? "text-gold-dark"
                : "text-charcoal-light"
            )}
            aria-live="polite"
          >
            {characterCount}/{maxLength}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MessageInput;
