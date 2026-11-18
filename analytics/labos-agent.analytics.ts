import type { LabosAgentPage } from '@/types/labos-agent.types';

/**
 * LabOS agent events (LAB-3298). STUB: the S0 event spec on LAB-3272 is not approved yet, so these handlers send
 * nothing. When Anuj approves S0, wire them to PostHog here, with the names in `utils/constants.ts`. Never add
 * message text, names or emails to an event.
 */
export interface LabosAgentEventContext {
  page: LabosAgentPage | 'none';
}

export function useLabosAgentAnalytics() {
  const onAgentOpened = (_props: LabosAgentEventContext & { entryPoint: string }) => {};
  const onAgentMessageSent = (_props: LabosAgentEventContext & { textLength: number; isRetry: boolean }) => {};
  const onAgentAnswerShown = (_props: LabosAgentEventContext & { sourceCount: number; durationMs: number }) => {};
  const onAgentErrorShown = (_props: LabosAgentEventContext & { code: string; status: number }) => {};

  return { onAgentOpened, onAgentMessageSent, onAgentAnswerShown, onAgentErrorShown };
}
