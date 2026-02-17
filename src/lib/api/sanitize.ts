/**
 * Input Sanitization Utilities
 *
 * Provides functions to sanitize user input to prevent XSS and other injection attacks.
 */

/**
 * HTML entity map for escaping dangerous characters
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 *
 * @param str - The string to escape
 * @returns The escaped string
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitize a string for safe storage and display
 * - Trims whitespace
 * - Normalizes whitespace (multiple spaces to single)
 * - Removes null bytes
 * - Removes control characters (except newlines and tabs)
 *
 * @param str - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize multiple spaces to single space
    .replace(/ +/g, ' ')
    // Normalize multiple newlines to max 2
    .replace(/\n{3,}/g, '\n\n');
}

/**
 * Sanitize message content for chat messages
 * Combines sanitization with length limits
 *
 * @param content - The message content to sanitize
 * @param maxLength - Maximum allowed length (default: 2000)
 * @returns The sanitized content
 */
export function sanitizeMessageContent(content: string, maxLength = 2000): string {
  const sanitized = sanitizeString(content);
  return sanitized.slice(0, maxLength);
}

/**
 * Sanitize a username or display name
 * - Removes special characters that could be used for impersonation
 * - Limits length
 *
 * @param name - The name to sanitize
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns The sanitized name
 */
export function sanitizeName(name: string, maxLength = 100): string {
  return name
    .trim()
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Remove characters that could be used for RTL/LTR spoofing
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
    // Limit length
    .slice(0, maxLength);
}

/**
 * Validate and sanitize an email address
 *
 * @param email - The email to validate and sanitize
 * @returns The sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }

  // Length check
  if (trimmed.length > 254) {
    return null;
  }

  return trimmed;
}

/**
 * Strip HTML tags from a string
 * Use this when you need plain text from potentially HTML content
 *
 * @param str - The string to strip tags from
 * @returns The string with all HTML tags removed
 */
export function stripHtmlTags(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize URL to prevent javascript: and data: URLs
 *
 * @param url - The URL to sanitize
 * @returns The sanitized URL or null if dangerous
 */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();

  // Check for dangerous protocols
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return null;
  }

  return trimmed;
}
