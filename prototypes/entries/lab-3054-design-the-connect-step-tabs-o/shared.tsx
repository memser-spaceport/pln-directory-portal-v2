'use client';

import { createContext, useContext } from 'react';

import { ClientLogo, clientKeyFromName } from './ClientLogo';
import type { ActionKind } from './mocks';
import s from './McpSectionMock.module.scss';

/** Fixed "now" for the mock, so relative times do not move between renders. */
export const NOW = new Date('2026-10-21T20:00:00Z').getTime();

/** Same format as production's `McpSection` `formatDate`. */
export function formatDate(value: string | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatAgo(value: string) {
  const minutes = Math.round((NOW - new Date(value).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Review-band switch: the backend tags are prototype scaffolding, hidden for clean screenshots. */
export const BackendTagsContext = createContext(true);

/**
 * Prototype-only mark on a part that needs backend work that does not exist yet.
 * One quiet style everywhere: a dashed outline chip in muted text, so it reads as
 * an annotation on the design, not as a status the member would see.
 */
export function BackendTag({ children }: { children: string }) {
  const show = useContext(BackendTagsContext);
  if (!show) return null;
  return <span className={s.backendTag}>{children}</span>;
}

/** The client's logo on a white tile: the same mark its Connect tab wears. */
export function AgentMark({ name }: { name: string }) {
  return (
    <span className={s.agentMark} aria-hidden>
      <ClientLogo client={clientKeyFromName(name)} size={18} />
    </span>
  );
}

/** Reads are the resting state and carry no label; the rest say what kind of act it was. */
export const KIND_LABEL: Record<ActionKind, string | null> = {
  read: null,
  change: 'Change',
  sent: 'Seen by others',
  blocked: 'Blocked by permissions',
};
