'use client';

import { useEffect, useRef, useState } from 'react';

import type { LabosAgentMentionsResponse } from '@/types/labos-agent.types';

import { LABOS_AGENT_MENTION_DEBOUNCE_MS } from '../constants';
import { getLabosAgentClient } from '../labos-agent.service';

export type LabosAgentMentionSearchStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * S6-F8: the picker search (C4). It calls C4 300 ms after the last key, the debounce of the Forum mention search
 * (`useMembersSearch`). A new key cancels the call in flight. It keeps only a response whose `q` is the current query,
 * so a slow answer for an old query never shows. S6-F16: every failure gives `error`.
 *
 * The result depends on the member and the query changes on each key, so there is no query cache (C4 is `@NoCache`).
 */
export function useLabosAgentMentionSearch(query: string | null) {
  const [state, setState] = useState<{
    q: string | null;
    status: LabosAgentMentionSearchStatus;
    response: LabosAgentMentionsResponse | null;
  }>({ q: null, status: 'idle', response: null });
  const current = useRef<string | null>(null);

  const q = query === null ? null : query.trim();

  useEffect(() => {
    current.current = q;
    // Until the answer comes, `state.q` is for an older query, so the hook gives `loading` (or `idle` for no query).
    if (q === null) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      getLabosAgentClient()
        .searchMentions({ q }, { signal: controller.signal })
        .then((response) => {
          if (controller.signal.aborted || current.current !== q || response.q.trim() !== q) return;
          setState({ q, status: 'ready', response });
        })
        .catch(() => {
          if (controller.signal.aborted || current.current !== q) return;
          setState({ q, status: 'error', response: null });
        });
    }, LABOS_AGENT_MENTION_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  // Before the effect runs for a new query, the old state is for another query: do not show it.
  if (state.q !== q) return { status: q === null ? 'idle' : 'loading', response: null } as const;
  return { status: state.status, response: state.response };
}
