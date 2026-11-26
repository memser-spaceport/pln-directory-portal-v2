'use client';

import { notFound } from 'next/navigation';
import { type ReactNode, useSyncExternalStore } from 'react';

import { useLabosAgentAccessState } from '@/services/labos-agent/hooks/useLabosAgentAccess';

import { AgentChat } from '../AgentChat/AgentChat';

interface Props {
  threadId: string;
  /** Today's thread page (`Chat`), or `null` when AI search has no such thread for this member. */
  fallback: ReactNode | null;
  /**
   * AI search has the thread under this member's account (`isOwner`). Not for another member's shared link, nor for
   * a chat the member started as a guest (matched by the `guestId` cookie): the agent's history (T2) has neither.
   */
  ownedByMember: boolean;
}

const noop = () => () => {};

/**
 * `/ai-search/<threadId>` for a signed-in member (LAB-3457). Inside the agent gate the thread opens in AI agent chat
 * on the agent (T2: old AI search threads and agent threads alike). An AI search thread that is not the member's
 * own (another member's shared link: "Shared by …", or a chat they started as a guest) keeps today's thread page, as
 * does one T2 does not know. Outside the gate, today's thread page shows, or the 404 page when AI search has no such
 * thread. Nothing shows until the gate answers.
 */
export function AiSearchThreadBody({ threadId, fallback, ownedByMember }: Props) {
  const access = useLabosAgentAccessState();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  if (!mounted || access === 'unknown') return null;
  if (access === 'on') {
    if (fallback && !ownedByMember) return <>{fallback}</>;
    return <AgentChat key={threadId} threadId={threadId} notFoundFallback={fallback} />;
  }
  if (!fallback) notFound();
  return <>{fallback}</>;
}
