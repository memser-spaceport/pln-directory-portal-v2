'use client';

import { usePathname } from 'next/navigation';

import { EVENTS_EMBED_PATH } from '@/services/events/all-events.filters';

/** Whether the path is a page other sites frame (LAB-3352): the events embed and nothing under another name. */
export const isEmbedPath = (pathname: string | null) =>
  pathname === EVENTS_EMBED_PATH || !!pathname?.startsWith(`${EVENTS_EMBED_PATH}/`);

/**
 * Leaves the site's chrome out of a framed page (LAB-3352): on `/events/embed` its children don't render at all, so
 * the frame shows the events view and none of the header, the mobile bar, feedback, contact support or rating
 * prompts. A client component because the root layout is a server component and cannot read the pathname; every
 * other route renders its children unchanged.
 */
export function EmbedChromeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isEmbedPath(pathname)) return null;
  return <>{children}</>;
}
