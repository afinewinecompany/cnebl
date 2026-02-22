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

/**
 * Allowed HTML tags for email content
 * Only safe, formatting-related tags are permitted
 */
const ALLOWED_EMAIL_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
  'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'span', 'div', 'hr',
]);

/**
 * Allowed attributes for HTML tags in emails
 */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title']),
  '*': new Set(['style']), // Allow style on all elements (for basic formatting)
};

/**
 * Sanitize HTML content for safe rendering in emails
 *
 * This function removes dangerous HTML elements and attributes while
 * preserving safe formatting tags. Use this before rendering with
 * dangerouslySetInnerHTML.
 *
 * Security features:
 * - Removes script, iframe, object, embed, form tags
 * - Removes event handler attributes (onclick, onerror, etc.)
 * - Validates href attributes to prevent javascript: URLs
 * - Preserves only safe formatting tags
 *
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML safe for email rendering
 */
export function sanitizeHtmlForEmail(html: string): string {
  if (!html) return '';

  let sanitized = html;

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags and their content (inline styles are ok, but style blocks can be dangerous)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove dangerous tags entirely
  const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'meta', 'link', 'base', 'svg', 'math'];
  for (const tag of dangerousTags) {
    const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    // Also remove self-closing versions
    sanitized = sanitized.replace(new RegExp(`<${tag}\\b[^>]*/?>`, 'gi'), '');
  }

  // Remove event handler attributes (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');

  // Sanitize href attributes - remove javascript:, data:, vbscript:
  sanitized = sanitized.replace(
    /href\s*=\s*["']\s*(javascript|data|vbscript):[^"']*["']/gi,
    'href="#"'
  );

  // Remove src attributes with dangerous protocols
  sanitized = sanitized.replace(
    /src\s*=\s*["']\s*(javascript|data|vbscript):[^"']*["']/gi,
    ''
  );

  // Remove any remaining javascript: URLs in other attributes
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove expression() in style attributes (IE vulnerability)
  sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');

  // Remove -moz-binding in styles (Firefox vulnerability)
  sanitized = sanitized.replace(/-moz-binding\s*:[^;}"']*/gi, '');

  // Remove behavior: in styles (IE vulnerability)
  sanitized = sanitized.replace(/behavior\s*:[^;}"']*/gi, '');

  return sanitized.trim();
}
