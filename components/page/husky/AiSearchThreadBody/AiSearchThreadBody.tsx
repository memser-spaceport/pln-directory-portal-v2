'use client';

import { notFound } from 'next/navigation';
import { type ReactNode, useSyncExternalStore } from 'react';

import { useLabosAgentAccessState } from '@/services/labos-agent/hooks/useLabosAgentAccess';

import { AgentChat } from '../AgentChat/AgentChat';

interface Props {
  threadId: string;
  /** Today's thread page (`Chat`), or `null` when AI search has no such thread for this member. */
  fallback: ReactNode | null;
}

const noop = () => () => {};

/**
 * `/ai-search/<threadId>` for a signed-in member (LAB-3457). Inside the agent gate the thread opens in AI agent chat
 * on the agent (T2: old AI search threads and agent threads alike). Outside it, today's thread page shows, or the
 * 404 page when AI search has no such thread. Nothing shows until the gate answers.
 */
export function AiSearchThreadBody({ threadId, fallback }: Props) {
  const access = useLabosAgentAccessState();
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  if (!mounted || access === 'unknown') return null;
  if (access === 'on') return <AgentChat key={threadId} threadId={threadId} />;
  if (!fallback) notFound();
  return <>{fallback}</>;
}
