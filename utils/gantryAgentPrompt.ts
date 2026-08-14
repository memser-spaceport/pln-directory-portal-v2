import { stripHtmlPreservingBreaks } from '@/utils/forum';

/* The backend rejects anything outside these bounds (CreateAgentSessionDto), so
   we clamp here instead of letting a Quill body that happens to be empty — or a
   very long one — come back as an undebuggable 400. */
export const AGENT_PROMPT_MIN_LENGTH = 3;
export const AGENT_PROMPT_MAX_LENGTH = 20000;

export interface BuiltAgentPrompt {
  readonly prompt: string;
  /** Body exceeded the backend limit and was cut short — the UI says so. */
  readonly isTruncated: boolean;
  /** Even the title is too thin to submit; the caller must block creation. */
  readonly isTooShort: boolean;
}

/* Cut back to the last line or word boundary so the agent never receives a
   prompt ending mid-word. Falls back to a hard slice when the tail is one
   unbroken run of characters. */
function truncateAtBoundary(text: string, limit: number): string {
  const hardCut = text.slice(0, limit);
  const boundary = Math.max(hardCut.lastIndexOf('\n'), hardCut.lastIndexOf(' '));
  return (boundary > limit * 0.5 ? hardCut.slice(0, boundary) : hardCut).trimEnd();
}

/**
 * Composes an agent-session prompt from a Gantry item.
 *
 * An agent session has no title field — the prompt is its only free text — so
 * the item's title and description have to travel together in one string.
 * `description` is Quill HTML, and an "empty" Quill body is `<p><br></p>`,
 * which is truthy: stripping is what tells us whether there's really a body.
 */
export function buildAgentPrompt(title: string, description?: string | null): BuiltAgentPrompt {
  const trimmedTitle = (title ?? '').trim();
  const body = description ? stripHtmlPreservingBreaks(description) : '';

  const composed = body ? `${trimmedTitle}\n\n${body}` : trimmedTitle;
  const isTruncated = composed.length > AGENT_PROMPT_MAX_LENGTH;
  const prompt = isTruncated ? truncateAtBoundary(composed, AGENT_PROMPT_MAX_LENGTH) : composed;

  return {
    prompt,
    isTruncated,
    isTooShort: prompt.length < AGENT_PROMPT_MIN_LENGTH,
  };
}
