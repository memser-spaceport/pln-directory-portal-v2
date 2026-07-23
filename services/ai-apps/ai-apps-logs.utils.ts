export type AiAppLogLevel = 'error' | 'warn';

/**
 * Canonical v1 heuristic for a line's severity — the backend contract carries
 * no `level` field yet (raised with backend; delete this when it lands). Whole
 * words only, so "0 errors" / "3 warnings" (plural) stay unmarked. Any other
 * surface (agent-facing included) must reuse this rather than reinvent it, so
 * humans and agents count the same errors.
 */
const ERROR_PATTERN = /\b(error|fatal|exception|panic)\b/i;
const WARN_PATTERN = /\bwarn(ing)?\b/i;

export function deriveLogLevel(message: string): AiAppLogLevel | null {
  if (ERROR_PATTERN.test(message)) return 'error';
  if (WARN_PATTERN.test(message)) return 'warn';
  return null;
}

const LOG_DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const LOG_TIME_FORMAT = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * Epoch-ms → viewer-local "Jul 23 14:02:05". Anything unparseable renders as
 * its raw value — never "Invalid Date" (the contract promises numbers, but the
 * runner envelope is passed through verbatim and is not to be trusted).
 */
export function formatLogTimestamp(value: unknown): string {
  const ms =
    typeof value === 'number' && Number.isFinite(value)
      ? value
      : typeof value === 'string' && value !== '' && Number.isFinite(Date.parse(value))
        ? Date.parse(value)
        : null;
  if (ms === null) {
    return value === null || value === undefined ? '' : String(value);
  }
  const date = new Date(ms);
  return `${LOG_DATE_FORMAT.format(date)} ${LOG_TIME_FORMAT.format(date)}`;
}

// ANSI escape sequences (CSI + other ESC-prefixed forms), C0 controls other
// than tab, and the bidi/zero-width characters that can visually reorder or
// hide copied text. Log messages are author-controlled input; they get to be
// text, not terminal instructions.
const ANSI_PATTERN = /\u001B\[[0-9;?]*[ -/]*[@-~]|\u001B[@-_]/g;
const CONTROL_PATTERN = /[\u0000-\u0008\u000B-\u001F\u007F]/g;
const BIDI_PATTERN = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;

/** Applied before both render and export — the two places a spoofed line could mislead. */
export function stripLogControlSequences(message: string): string {
  return message.replace(ANSI_PATTERN, '').replace(CONTROL_PATTERN, '').replace(BIDI_PATTERN, '');
}
