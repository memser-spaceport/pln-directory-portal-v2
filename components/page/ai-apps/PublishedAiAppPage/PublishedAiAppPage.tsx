'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { PublishedAiApp } from '@/services/ai-apps/ai-apps.service';
import { usePublishedAiApps } from '@/services/ai-apps/hooks/usePublishedAiApps';
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
 * More menu. The published list is the only access check on this page: the
 * member has no `ai_apps.read`, so nothing here may call the AI Apps catalog
 * API, and the app's own sidecar signs the member in inside the frame.
 */
export function PublishedAiAppPage(props: Props) {
  const { uid, basePath } = props;

  const { apps, isLoading } = usePublishedAiApps();
  const analytics = useAiAppsAnalytics();
  const trackedUnavailableUid = useRef<string | null>(null);

  const app = apps.find((item) => item.uid === uid) ?? null;
  const appOrigin = app ? appOriginOf(app.url) : null;
  const isUnavailable = !isLoading && (!app || !appOrigin);

  useEffect(() => {
    if (!isUnavailable || trackedUnavailableUid.current === uid) return;
    trackedUnavailableUid.current = uid;
    analytics.onPublishedAppUnavailable(uid);
  }, [isUnavailable, uid, analytics]);

  if (app && appOrigin) {
    return <PublishedAiAppFrame app={app} appOrigin={appOrigin} basePath={basePath} />;
  }

  if (isLoading) {
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
    <div className={s.root}>
      <iframe ref={iframeRef} className={s.iframe} src={frameSrc} title={app.name} allow="fullscreen" />
    </div>
  );
}
