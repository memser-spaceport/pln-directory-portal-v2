'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { isPublishedAiAppSegment, publishedAiAppSegment } from '@/services/ai-apps/ai-apps.service';
import { usePublishedAiApps } from '@/services/ai-apps/hooks/usePublishedAiApps';
import { PUBLISHED_AI_APPS_PATH } from '@/services/ai-apps/constants';

interface Props {
  readonly children: ReactNode;
  /**
   * The app this page shows (`/pl-infra/ai-apps/<segment>/…`). A member without AI Apps access who follows such a
   * link to an app published to them is sent to the app at `/apps/<path or uid>` instead of Home (LAB-3336).
   */
  readonly publishedAppSegment?: string;
}

const CATALOG_APP_PATH = '/pl-infra/ai-apps/';

export function AiAppsAccessGuard({ children, publishedAppSegment }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const analytics = useAiAppsAnalytics();
  const deniedTracked = useRef(false);
  // Once we've rendered children, keep them mounted across loading flickers so
  // in-progress client state (e.g. pasted AI App secrets) is not discarded.
  const hasGrantedAccess = useRef(false);
  const { permsSet, isLoading, isError } = usePermissions();
  const hasAccess = canViewAiApps(permsSet);
  const { apps: publishedApps, isLoading: isPublishedLoading } = usePublishedAiApps();
  const publishedApp = publishedAppSegment
    ? (publishedApps.find((app) => isPublishedAiAppSegment(app, publishedAppSegment)) ?? null)
    : null;

  if (!isLoading && !isError && hasAccess) {
    hasGrantedAccess.current = true;
  }

  useEffect(() => {
    if (isLoading || (!isError && hasAccess)) return;
    // The published list decides where a member without AI Apps access goes; wait for it.
    if (publishedAppSegment && isPublishedLoading) return;
    if (publishedApp && publishedAppSegment) {
      const prefix = `${CATALOG_APP_PATH}${publishedAppSegment}`;
      const subpath = pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : '';
      const search = typeof window === 'undefined' ? '' : window.location.search;
      router.replace(`${PUBLISHED_AI_APPS_PATH}/${publishedAiAppSegment(publishedApp)}${subpath}${search}`);
      return;
    }
    if (!deniedTracked.current) {
      deniedTracked.current = true;
      analytics.onAccessDenied(pathname);
    }
    router.replace('/');
  }, [
    isLoading,
    isError,
    hasAccess,
    publishedAppSegment,
    isPublishedLoading,
    publishedApp,
    router,
    pathname,
    analytics,
  ]);

  if (hasGrantedAccess.current) {
    return <>{children}</>;
  }

  if (isLoading || isError || !hasAccess) {
    return null;
  }

  return <>{children}</>;
}
