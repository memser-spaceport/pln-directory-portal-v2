'use client';

import { usePathname } from 'next/navigation';

import { isPublishedAiAppSegment } from '@/services/ai-apps/ai-apps.service';
import { usePublishedAiApps } from '@/services/ai-apps/hooks/usePublishedAiApps';
import { PUBLISHED_AI_APPS_PATH } from '@/services/ai-apps/constants';

/** The `<segment>` of `/apps/<segment>/…`, or null on any other route. */
export function publishedAppSegmentOf(pathname: string | null): string | null {
  const prefix = `${PUBLISHED_AI_APPS_PATH}/`;
  if (!pathname?.startsWith(prefix)) return null;
  const segment = pathname.slice(prefix.length).split('/')[0];
  return segment ? decodeURIComponent(segment) : null;
}

/**
 * Renders the LabOS top navigation, except on an AI App an admin set to "hide top navigation" (LAB-3238). The
 * decision is made here, from the route and the published list, rather than by the app page after it mounts: on
 * `/apps/…` the header is not rendered at all until the list says the app keeps it, so a full-page app never
 * shows the header first (LAB-3335). Every other route renders it straight away.
 */
export function TopNavGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { apps, isLoading } = usePublishedAiApps();
  const segment = publishedAppSegmentOf(pathname);

  if (segment) {
    if (isLoading) return null;
    const app = apps.find((item) => isPublishedAiAppSegment(item, segment));
    if (app?.hideTopNav) return null;
  }
  return <>{children}</>;
}
