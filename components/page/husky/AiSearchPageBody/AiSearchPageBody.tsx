'use client';

import { useSyncExternalStore } from 'react';

import { useLabosAgentAccessState } from '@/services/labos-agent/hooks/useLabosAgentAccess';

import { AgentChat } from '../AgentChat/AgentChat';
import { ChatContainer } from '../ChatContainer';

interface Props {
  isLoggedIn: boolean;
}

const noop = () => () => {};

/**
 * `/ai-search` (LAB-3457): a member inside the agent gate (`useLabosAgentAccessState`) gets AI agent chat on the agent
 * (`AgentChat`). Everyone else, signed out or outside the gate, keeps today's page (`ChatContainer`) unchanged.
 * Signed in, nothing shows until the gate answers: today's page reads handed-over questions from storage on mount and
 * would send them to AI search before the agent page takes over.
 */
export function AiSearchPageBody({ isLoggedIn }: Props) {
  const access = useLabosAgentAccessState();
  // The gate reads localStorage, so the server and the first client render never decide for a signed-in member.
  const mounted = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  if (!isLoggedIn) return <ChatContainer isLoggedIn={false} />;
  if (!mounted || access === 'unknown') return null;
  return access === 'on' ? <AgentChat /> : <ChatContainer isLoggedIn />;
}
