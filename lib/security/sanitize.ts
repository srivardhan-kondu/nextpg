/**
 * Defence-in-depth text hygiene.
 *
 * React escapes interpolated text by default, so this is not our only XSS
 * guard — it exists because user-supplied strings (candidate name, admin notes)
 * also land in PDFs, emails and LLM prompts, none of which have React's escaping.
 */
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

const HTML_CHARS: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS, '');
}

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => HTML_CHARS[c] ?? c);
}

/** Normalises a free-text field: trims, collapses whitespace, caps length. */
export function sanitizeText(input: string, maxLength = 200): string {
  return stripControlChars(input).replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Neutralises prompt-injection framing before user text reaches the assistant.
 * The system prompt is also defensive, but stripping role markers here keeps a
 * pasted "system:" block from being read as an instruction boundary.
 */
export function sanitizeForPrompt(input: string, maxLength = 2000): string {
  return stripControlChars(input)
    .replace(/^\s*(system|assistant|developer)\s*:/gim, '')
    .replace(/<\/?(system|assistant|instructions)>/gi, '')
    .trim()
    .slice(0, maxLength);
}
