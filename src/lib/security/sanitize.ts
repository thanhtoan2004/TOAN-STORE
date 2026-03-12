/**
 * Simple server-side HTML sanitizer.
 * Strips all HTML tags and decodes common HTML entities.
 * Used instead of isomorphic-dompurify to avoid jsdom ESM compatibility issues.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';

  return (
    input
      // Remove script tags and contents
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove style tags and contents
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
      .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
      // Remove javascript: URIs
      .replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href=$1#$1')
      .replace(/src\s*=\s*(['"])javascript:[^'"]*\1/gi, 'src=$1#$1')
      // Decode common HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
  );
}

/**
 * Strips ALL HTML tags from a string, keeping only text content.
 * Use this for plain-text fields like names, questions, etc.
 */
export function stripHtmlTags(input: string): string {
  if (!input) return '';
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize for rich HTML content (FAQ answers, news content).
 * Allows basic formatting tags but strips dangerous content.
 */
export function sanitizeRichContent(input: string): string {
  if (!input) return '';

  // First remove dangerous content
  const clean = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/\s*on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/href\s*=\s*(['"])javascript:[^'"]*\1/gi, 'href=$1#$1')
    .replace(/src\s*=\s*(['"])javascript:[^'"]*\1/gi, 'src=$1#$1');

  return clean;
}
