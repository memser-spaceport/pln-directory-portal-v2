'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useTopNavStore } from '@/components/core/TopNavGate';
import { fetchAiApp, isPublishedAiAppSegment, PublishedAiApp } from '@/services/ai-apps/ai-apps.service';
import { usePublishedAiApps } from '@/services/ai-apps/hooks/usePublishedAiApps';
import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { PAGE_ROUTES } from '@/utils/constants';

import {
  dropDeniedAppParamsFromAddressBar,
  initialAppRoute,
  mirroredAppUrl,
  readAppRouteMessage,
  resolveAppPath,
} from '../utils/appRoute';

import s from './PublishedAiAppPage.module.scss';

interface Props {
  uid: string;
  basePath: string;
}

/** Only an http(s) URL is ever framed; anything else reads as "not available". */
function appOriginOf(url: string): string | null {
  try {
    const { origin, protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:' ? origin : null;
  } catch {
    return null;
  }
}

/**
 * An AI App published to members outside PL Infra (LAB-3200), opened from the
 * More menu or a link: `/apps/<uid>` or the admin-set `/apps/<path>` (LAB-3238).
 * The published list is the access check on this page: an audience member has
 * no `ai_apps.read`, so only a PL Infra member outside the audience ever reaches
 * the AI Apps catalog API here, to be sent to the app's catalog page. The app's
 * own sidecar signs the member in inside the frame.
 */
export function PublishedAiAppPage(props: Props) {
  const { uid: segment, basePath } = props;

  // Fresh, not the menu's cached list: the member may have been taken out of
  // the audience since the menu loaded.
  const { apps, isLoading } = usePublishedAiApps({ fresh: true });
  const { permsSet, isLoading: isPermissionsLoading } = usePermissions();
  const router = useRouter();
  const analytics = useAiAppsAnalytics();
  const trackedUnavailableUid = useRef<string | null>(null);

  const app = apps.find((item) => isPublishedAiAppSegment(item, segment)) ?? null;
  const appOrigin = app ? appOriginOf(app.url) : null;
  const notPublishedToMember = !isLoading && (!app || !appOrigin);
  const canOpenCatalog = !isPermissionsLoading && canViewAiApps(permsSet);

  // A PL Infra member following a shared link to an app outside their audience
  // opens it from the catalog instead (the path resolves there too).
  const shouldCheckCatalog = notPublishedToMember && canOpenCatalog;
  const [catalogResult, setCatalogResult] = useState<{ segment: string; uid: string | null } | null>(null);

  useEffect(() => {
    if (!shouldCheckCatalog) return;
    let cancelled = false;
    fetchAiApp(segment).then(
      ({ app: catalogApp }) => {
        if (!cancelled) setCatalogResult({ segment, uid: catalogApp?.uid ?? null });
      },
      () => {
        if (!cancelled) setCatalogResult({ segment, uid: null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [shouldCheckCatalog, segment]);

  // undefined until the catalog answered for this link; null when it does not know it.
  const catalogUid = catalogResult?.segment === segment ? catalogResult.uid : undefined;

  useEffect(() => {
    if (catalogUid) router.replace(`/pl-infra/ai-apps/${encodeURIComponent(catalogUid)}`);
  }, [catalogUid, router]);

  const isUnavailable = notPublishedToMember && !isPermissionsLoading && (!canOpenCatalog || catalogUid === null);
  const uid = app?.uid ?? segment;

  useEffect(() => {
    if (!isUnavailable || trackedUnavailableUid.current === uid) return;
    trackedUnavailableUid.current = uid;
    analytics.onPublishedAppUnavailable(uid);
  }, [isUnavailable, uid, analytics]);

  if (app && appOrigin) {
    return <PublishedAiAppFrame app={app} appOrigin={appOrigin} basePath={basePath} />;
  }

  if (!isUnavailable) {
    return <div className={s.state}>Loading app…</div>;
  }

  // Said out loud rather than redirected away: the member followed a link they
  // were given, and a silent bounce to Home reads as a broken link.
  return (
    <div className={s.state}>
      <div className={s.unavailable}>
        <h1 className={s.unavailableTitle}>This app is not available to you</h1>
        <p className={s.unavailableText}>It may not be shared with you, or it is no longer published.</p>
        <Link href={PAGE_ROUTES.HOME} className={s.unavailableLink}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

interface FrameProps {
  app: PublishedAiApp;
  appOrigin: string;
  basePath: string;
}

function PublishedAiAppFrame(props: FrameProps) {
  const { app, appOrigin, basePath } = props;

  const pathname = usePathname();
  const analytics = useAiAppsAnalytics();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const trackedAppUid = useRef<string | null>(null);
  // The app subpage is the URL segment after the base path (`/apps/<uid>/reports`
  // → `/reports`). Both are captured once: the route sync below rewrites the
  // address bar, and a recomputed src would reload the frame.
  const [initialPath] = useState(() => (pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : null));
  const [initialSearch] = useState(() => (typeof window === 'undefined' ? '' : window.location.search));
  const [appPageTitle, setAppPageTitle] = useState<string | null>(null);
  const setTopNavHidden = useTopNavStore((state) => state.setHidden);
  const fullPage = !!app.hideTopNav;

  // "Hide top navigation" (LAB-3238): the app runs full page while it is open.
  useEffect(() => {
    if (!fullPage) return;
    setTopNavHidden(true);
    return () => setTopNavHidden(false);
  }, [fullPage, setTopNavHidden]);

  // Reserved and denylisted query keys never reach the iframe (resolveAppPath).
  const frameSrc = useMemo(() => {
    const seed = initialAppRoute(initialPath, initialSearch);
    const path = seed ? resolveAppPath(appOrigin, seed) : null;
    if (!path || path === '/') return app.url;
    return `${appOrigin}${path}`;
  }, [app.url, appOrigin, initialPath, initialSearch]);

  useEffect(() => {
    const name = app.name.trim();
    if (!name) return;
    const previous = document.title;
    document.title = appPageTitle && appPageTitle !== name ? `${appPageTitle} · ${name}` : name;
    return () => {
      document.title = previous;
    };
  }, [app.name, appPageTitle]);

  useEffect(() => {
    dropDeniedAppParamsFromAddressBar();
  }, []);

  useEffect(() => {
    if (trackedAppUid.current === app.uid) return;
    trackedAppUid.current = app.uid;
    analytics.onPublishedAppOpened(app.uid, app.name, resolveAppPath(appOrigin, initialPath));
  }, [app.uid, app.name, appOrigin, initialPath, analytics]);

  // The app reports its in-app navigation; mirror it into the address bar so
  // the page can be shared and reloaded at the same subpage.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const report = readAppRouteMessage(event, appOrigin, iframeRef.current?.contentWindow);
      if (!report) return;
      setAppPageTitle(report.title);
      if (!report.path) return;
      window.history.replaceState(null, '', mirroredAppUrl(basePath, report.path));
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [appOrigin, basePath]);

  return (
    <div className={clsx(s.root, { [s.rootFullPage]: fullPage })}>
      <iframe ref={iframeRef} className={s.iframe} src={frameSrc} title={app.name} allow="fullscreen" />
    </div>
  );
}
