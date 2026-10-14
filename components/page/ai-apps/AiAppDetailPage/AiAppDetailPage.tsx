'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMedia } from 'react-use';

import { useAiAppsAnalytics } from '@/analytics/ai-apps.analytics';
import { useCurrentUserStore } from '@/services/auth/store';
import { useAiApp } from '@/services/ai-apps/hooks/useAiApp';
import { useAiAppManageAccess } from '@/services/ai-apps/hooks/useAiAppManageAccess';
import {
  AiAppTargetEnvironment,
  aiAppStatusLabel,
  aiAppTarget,
  checkAiAppLive,
  deployFailureKind,
  hasPrd,
  isPrivateAiApp,
  recordAiAppView,
} from '@/services/ai-apps/ai-apps.service';
import { DocumentIcon } from '@/components/icons';
import { Button } from '@/components/common/Button';
import { AppActionsMenu } from '@/components/page/ai-apps/AiAppsPage/components/AppActionsMenu';
import {
  EditAiAppModal,
  ManageAccessModal,
  DeploymentSettingsModal,
  DeploymentLogsModal,
  DeleteAiAppDialog,
  AiAppDetailsModal,
} from '@/components/page/ai-apps/dynamicActionModals';
import {
  SHOW_AI_APPS_COMMENTS,
  SHOW_AI_APPS_ELEMENT_PINS,
  SHOW_AI_APPS_FEEDBACK_OVERLAY,
} from '@/services/ai-apps/constants';
import { BRIDGE_VERSION } from '@/ai-apps-bridge/protocol';
import type { FeedbackContext } from '@/services/ai-app-feedback/ai-app-feedback.service';
import { useAppFeedbackPins } from '@/services/ai-app-feedback/hooks/useAppFeedbackPins';
import { FloatingFeedbackButton } from '../components/FloatingFeedbackButton';
import { CommentMode, normalizeAppPath, useElementPins } from '../components/element-pins';
import { AiAppTagChips } from '../components/AiAppTagChips';
import { LockIcon } from '../AiAppsPage/components/ManageAccessModal/icons';

import { AppSecretsPanel } from './components/AppSecretsPanel';

import s from './AiAppDetailPage.module.scss';

interface Props {
  uid: string;
  basePath: string;
}

type Action = 'edit' | 'access' | 'deployment' | 'logs' | 'delete';

const SETUP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  DEPLOYING: 'Deploying',
  ERROR: 'Deploy failed',
};

/**
 * Liveness polling cadence: ~6 minutes of 4s probes before giving up — the
 * pod-up → domain-registration gap after a deploy has been observed to take
 * 1–5 minutes, so giving up sooner strands users on "Try again".
 */
const LIVENESS_INTERVAL_MS = 4000;
const LIVENESS_MAX_ATTEMPTS = 90;

/**
 * Reachability of the embedded app, gating the iframe. We never mount the
 * iframe until a server-side probe confirms the app answers — otherwise the
 * frame captures a raw gateway error page (504) while the container starts.
 */
type FrameStatus = 'checking' | 'live' | 'down';

/**
 * Sent by the embedded app (starter kit ≥1.10) on load and on every in-app
 * navigation: `{ type, path, title }`. The frame is cross-origin, so this is
 * the only way to learn which subpage is open. Kits ≥1.14 send pathname +
 * query (never the hash), addressed to this origin. Kits 1.12–1.13 sent the
 * pathname only; kits 1.10–1.11 sent pathname + query + hash to `'*'`. The
 * listener drops the hash, reserved portal params, and secret-like query keys
 * no matter what the sender included.
 */
const APP_ROUTE_MESSAGE = 'pln-ai-app:route';
const MAX_APP_PATH_LENGTH = 2048;
const MAX_APP_TITLE_LENGTH = 200;

/**
 * Portal-owned keys on this page's query string. They stay on the parent URL
 * and are never forwarded into the iframe (`?settings=deployment` opens a
 * LabOS modal; `path` is the legacy deep-link param; `feedback=<uid>` opens
 * that feedback's pins on the page).
 */
const RESERVED_PORTAL_PARAMS = new Set(['settings', 'path', 'feedback']);

/**
 * Exact, case-insensitive. These names are where OAuth callbacks (`?code=`),
 * magic links and tokens land — they must not be mirrored into a shareable
 * URL or replayed as the iframe's initial query. `state` is ordinary UI state
 * in apps, so it is not listed.
 */
const DENIED_APP_PARAMS = new Set([
  'code',
  'token',
  'access_token',
  'id_token',
  'refresh_token',
  'secret',
  'client_secret',
  'key',
  'api_key',
  'apikey',
  'auth',
  'authorization',
  'password',
  'passwd',
  'pwd',
  'jwt',
  'bearer',
  'otp',
]);

function isReservedPortalParam(key: string): boolean {
  return RESERVED_PORTAL_PARAMS.has(key.toLowerCase());
}

function isDeniedAppParam(key: string): boolean {
  return DENIED_APP_PARAMS.has(key.toLowerCase());
}

/** App-owned query string: reserved portal keys and the secret denylist are dropped. */
function filterAppSearch(params: URLSearchParams): string {
  const kept = new URLSearchParams();
  for (const [key, value] of params) {
    if (isReservedPortalParam(key) || isDeniedAppParam(key)) continue;
    kept.append(key, value);
  }
  const qs = kept.toString();
  return qs ? `?${qs}` : '';
}

// Accepts only a path on the app's own origin; the origin comparison rejects
// `//host`, absolute URLs, backslashes and non-http schemes in one go.
// Returns pathname + safe query. The hash is never kept.
function resolveAppPath(appOrigin: string, raw: unknown): string | null {
  if (typeof raw !== 'string' || !raw || raw.length > MAX_APP_PATH_LENGTH) return null;
  try {
    const url = new URL(raw, appOrigin);
    if (url.origin !== appOrigin) return null;
    const path = `${url.pathname}${filterAppSearch(url.searchParams)}`;
    if (path.length > MAX_APP_PATH_LENGTH) return null;
    return path;
  } catch {
    return null;
  }
}

/** Pathname segment plus the query captured on first load, if either is present. */
function initialAppRoute(path: string | null, search: string): string | null {
  if (!path && !search) return null;
  return `${path ?? '/'}${search}`;
}

/**
 * Parent query after a route report: the app's filtered params, then reserved
 * portal params copied from the current address bar so they win and survive
 * an in-app navigation that reports no query.
 */
function parentSearchForAppRoute(appPath: string): string {
  const merged = new URLSearchParams(new URL(appPath, 'https://placeholder.invalid').search);
  for (const [key, value] of new URLSearchParams(window.location.search)) {
    if (isReservedPortalParam(key)) merged.append(key, value);
  }
  const qs = merged.toString();
  return qs ? `?${qs}` : '';
}

function mirroredAppUrl(basePath: string, appPath: string): string {
  const queryAt = appPath.indexOf('?');
  const appPathname = queryAt === -1 ? appPath : appPath.slice(0, queryAt);
  const segment = appPathname === '/' ? '' : appPathname;
  return `${basePath}${segment}${parentSearchForAppRoute(appPath)}`;
}

export function AiAppDetailPage(props: Props) {
  const { uid, basePath } = props;

  const { app, errorKind, isLoading, isError } = useAiApp(uid);
  const { currentUser } = useCurrentUserStore();
  const { canLikelyManage, isDirectoryAdmin } = useAiAppManageAccess();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useAiAppsAnalytics();
  // Guards the one-shot deep-link open so closing the modal doesn't reopen it.
  const openedSettingsFromUrl = useRef(false);
  const trackedAppUid = useRef<string | null>(null);
  const trackedDraftSetupUid = useRef<string | null>(null);
  const trackedPrivateBlockUid = useRef<string | null>(null);
  const iframeTracked = useRef<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Latest subpage reported by the app; seeds the frame src on a redeploy remount.
  const appPathRef = useRef<string | null>(null);
  // The app subpage is the URL segment after the route's base path, e.g.
  // `/pl-infra-os/flywheels` → `/flywheels`. Captured once: later replaceState
  // updates must not recompute the iframe src (that reloads the frame).
  const [initialPath] = useState(() => (pathname.startsWith(`${basePath}/`) ? pathname.slice(basePath.length) : null));
  // window is the source of truth in the browser. On the server (no window)
  // fall back to the router snapshot so a deep link's query survives SSR.
  const [initialSearch, setInitialSearch] = useState(() => {
    if (typeof window !== 'undefined') return window.location.search;
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
  });
  const [appPageTitle, setAppPageTitle] = useState<string | null>(null);
  // The app page on screen, for the feedback overlay (only this page's pins are
  // looked for). Seeded from the deep link; then from the app's route reports.
  const [currentAppPath, setCurrentAppPath] = useState<string | null>(initialPath);
  const [isRedeploying, setIsRedeploying] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  // Bumped by "Try again" to restart the polling effect after it gave up.
  const [retryToken, setRetryToken] = useState(0);
  const [previewEnv, setPreviewEnv] = useState<AiAppTargetEnvironment>('prod');
  // Result of the liveness polling, tagged with the generation it probed. A new
  // generation (fresh deploy or retry) makes the derived status fall back to
  // 'checking' without the effect having to reset any state synchronously.
  const [probeResult, setProbeResult] = useState<{ generation: string; status: 'live' | 'down' } | null>(null);

  useEffect(() => {
    const name = app?.name?.trim();
    if (!name) return;
    const previous = document.title;
    document.title = appPageTitle && appPageTitle !== name ? `${appPageTitle} · ${name}` : name;
    return () => {
      document.title = previous;
    };
  }, [app?.name, appPageTitle]);

  // Deep link: `?settings=deployment` opens the Deployment settings modal
  // straight away (shared with members to edit stored secrets & redeploy).
  // Creator/admin only — the modal exposes env-var names and failure notes, and
  // the ⋯ menu (the other entry point) is gated the same way. Waits for the app
  // record so the server-computed canManage can be consulted.
  useEffect(() => {
    if (openedSettingsFromUrl.current) return;
    if (searchParams.get('settings') !== 'deployment') return;
    if (!app) return;
    const creatorLike = app.canManage ?? (!!currentUser?.uid && currentUser.uid === app.member?.uid);
    // One-shot either way — a later refetch must not pop the modal open.
    openedSettingsFromUrl.current = true;
    if (creatorLike) {
      setAction('deployment');
    }
  }, [searchParams, app, currentUser]);

  const requiredEnvVars = app?.requiredEnvVars ?? [];
  // Genuinely "never deployed" only means DRAFT — DEPLOYING/ERROR have their
  // own dedicated flags below (which correctly respect `isRedeploying`).
  // Checking `status !== 'READY'` here too would also catch a DEPLOYING app
  // between polls of our own voluntary redeploy, bypassing that guard and
  // yanking into this mandatory branch mid-flight.
  const needsSetup = !!app && requiredEnvVars.length > 0 && app.status === 'DRAFT';
  // A failed deploy (runner error, or a stuck deploy the backend settled to
  // ERROR) is surfaced as a full status card — never a broken iframe — with the
  // error notes and a retry path for the creator/admin. Exception: 'warning'
  // (the previous revision still serves) renders the normal layout — the app
  // WORKS, replacing it with an error card would read as an outage.
  const deployFailed = app?.status === 'ERROR';
  const failureKind = app ? deployFailureKind(app) : null;
  // An in-flight deploy someone else started (agent redeploy, another admin).
  // While OUR deploy runs (isRedeploying) the secrets panel or the deployment
  // settings modal owns the UI instead, so neither is unmounted mid-flight.
  const deployInProgress = app?.status === 'DEPLOYING' && !isRedeploying;

  useEffect(() => {
    if (errorKind !== 'forbidden' || app || trackedPrivateBlockUid.current === uid) return;
    trackedPrivateBlockUid.current = uid;
    analytics.onPrivateBlocked(uid);
  }, [errorKind, app, uid, analytics]);

  useEffect(() => {
    if (!app || app.status !== 'DRAFT' || !needsSetup || trackedDraftSetupUid.current === app.uid) return;
    trackedDraftSetupUid.current = app.uid;
    analytics.onDraftSetupViewed({ appUid: app.uid, appName: app.name });
  }, [app, needsSetup, analytics]);

  useEffect(() => {
    if (isError && uid) {
      analytics.onIframeLoadFailed(uid, uid);
    }
  }, [isError, uid, analytics]);

  const prodTarget = app ? aiAppTarget(app, 'prod') : null;
  const previewRow = app?.deployments?.preview ?? null;
  const canOpenPreview = !!previewRow && !!app?.canViewPreview;
  const previewTargetRow = app ? aiAppTarget(app, 'preview') : null;
  const selectedEnv = canOpenPreview ? previewEnv : 'prod';
  const previewTarget = selectedEnv === 'preview' ? previewTargetRow : prodTarget;
  const appUrl = previewTarget?.url ?? (selectedEnv === 'prod' ? (app?.url ?? null) : null);
  const appOrigin = useMemo(() => {
    if (!appUrl) return null;
    try {
      return new URL(appUrl).origin;
    } catch {
      return null;
    }
  }, [appUrl]);

  useEffect(() => {
    if (!app || trackedAppUid.current === app.uid) return;
    trackedAppUid.current = app.uid;
    analytics.onDetailPageViewed(app.uid, app.name, appOrigin ? resolveAppPath(appOrigin, initialPath) : null);
  }, [app, analytics, appOrigin, initialPath]);

  // "The running version changed" key for the probe generation and the iframe
  // remount. lastDeployedAt moves only on SUCCESSFUL deploys — keying on
  // updatedAt would remount a visitor's working previous version whenever a
  // FAILED deploy bumps the row (warning state). updatedAt stays as the
  // fallback for pre-contract API responses that lack the field.
  const deployGeneration = previewTarget?.lastDeployedAt ?? app?.updatedAt ?? '';
  // One probe "generation" per deployed version and per manual retry; probe
  // results from older generations are ignored, so a fresh deploy always
  // re-checks.
  const probeGeneration = `${deployGeneration}:${retryToken}`;
  const frameStatus: FrameStatus = probeResult?.generation === probeGeneration ? probeResult.status : 'checking';

  // Recomputed only per deployed version: every route message re-renders this
  // component through the synced pathname, and a changed src would reload the
  // frame. Reading the ref makes a redeploy remount reopen the same subpage
  // and query. Reserved and denylisted keys never reach the iframe.
  const frameSrc = useMemo(() => {
    if (!appOrigin) return appUrl ?? undefined;
    const seed = appPathRef.current ?? initialAppRoute(initialPath, initialSearch);
    const path = seed ? resolveAppPath(appOrigin, seed) : null;
    if (!path || path === '/') return appUrl ?? undefined;
    return `${appOrigin}${path}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUrl, appOrigin, initialPath, initialSearch, deployGeneration]);

  // A pasted link can already carry `?code=` / `?token=`. Drop those before the
  // app reports a route so they don't sit in the address bar.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let removed = false;
    for (const key of [...params.keys()]) {
      if (!isDeniedAppParam(key)) continue;
      params.delete(key);
      removed = true;
    }
    if (!removed) return;
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, []);

  // A server render has no window, and useState does not re-run on hydration.
  // If that left the query empty, pick it up before the liveness probe mounts
  // the iframe (the probe is async) so the deep link is the first src.
  useEffect(() => {
    if (initialSearch) return;
    const live = window.location.search;
    if (live) setInitialSearch(live);
  }, [initialSearch]);

  useEffect(() => {
    if (!appOrigin) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== appOrigin || event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== APP_ROUTE_MESSAGE) return;

      const title = typeof event.data.title === 'string' ? event.data.title.trim().slice(0, MAX_APP_TITLE_LENGTH) : '';
      setAppPageTitle(title || null);

      const path = resolveAppPath(appOrigin, event.data.path);
      if (!path) return;
      appPathRef.current = path;
      setCurrentAppPath(path);
      window.history.replaceState(null, '', mirroredAppUrl(basePath, path));
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [appOrigin, basePath]);

  // Poll the backend liveness probe until the app answers, then mount the
  // iframe. Runs on first load and again after every successful redeploy
  // (lastDeployedAt changes / the deploy flag drops), so gateway errors never
  // reach the frame.
  useEffect(() => {
    if (!appUrl || isRedeploying) return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const probe = async () => {
      const live = await checkAiAppLive(uid, selectedEnv);
      if (cancelled) return;
      if (live) {
        setProbeResult({ generation: probeGeneration, status: 'live' });
        return;
      }
      attempts += 1;
      if (attempts >= LIVENESS_MAX_ATTEMPTS) {
        setProbeResult({ generation: probeGeneration, status: 'down' });
        return;
      }
      timer = setTimeout(probe, LIVENESS_INTERVAL_MS);
    };

    probe();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [uid, appUrl, probeGeneration, isRedeploying, selectedEnv]);

  // The in-app bridge (starter kit script). Pin state lives here, next to the
  // iframe it belongs to; the feedback button only drives it. Keyed on the
  // same generation as the iframe, so a redeploy remount starts clean.
  const elementPins = useElementPins({
    iframeRef,
    appOrigin,
    frameKey: deployGeneration,
    enabled: SHOW_AI_APPS_ELEMENT_PINS,
    appUid: uid,
  });

  // Feedback in context. Comments are public: everyone who can open the app reads
  // them all, and the API adds the private feedback each viewer may also see
  // (creator and admins: all of it; anyone else: their own). Nothing is fetched
  // when signed out: these are authenticated requests (customFetch reloads on a
  // missing session).
  const canManageApp = !!app && (app.canManage ?? (!!currentUser?.uid && currentUser.uid === app.member?.uid));
  const overlayScope: 'all' | null =
    !SHOW_AI_APPS_COMMENTS || !SHOW_AI_APPS_FEEDBACK_OVERLAY || !app || !currentUser?.uid ? null : 'all';
  // Comment mode (prototype `CommentLayer`): the feedback button toggles it; pins
  // are only drawn while it is on. Needs the app's bridge, and a running frame.
  const [commentModeOn, setCommentModeOn] = useState(false);
  /*
    Phone (LAB-2796, prototype ai-apps-feedback-drawer): the feedback drawer is the
    whole screen there, so it can't sit beside the app. "Add a comment" (or a row
    in the list) puts it aside and the app takes taps, under comment mode's bar;
    Done brings the list back. Leaving the mode, or a window grown past a phone's,
    ends it.
  */
  const isPhone = useMedia('(max-width: 639px)', false);
  const [placing, setPlacing] = useState(false);
  if (placing && (!commentModeOn || !isPhone)) setPlacing(false);
  // Shipped comments stay on the page, faded (prototype), so they're always fetched.
  // While the mode is on, other members' new comments come in without a reload.
  const feedbackPins = useAppFeedbackPins({
    appUid: uid,
    scope: overlayScope,
    includeResolved: true,
    enabled: overlayScope !== null,
    live: commentModeOn,
  });
  // Opening the mode reads the pins afresh, however recently they were fetched.
  const refetchPins = feedbackPins.refetch;
  useEffect(() => {
    if (commentModeOn && overlayScope !== null) void refetchPins();
  }, [commentModeOn, overlayScope, refetchPins]);
  const [openFeedbackPin, setOpenFeedbackPin] = useState<string | null>(null);
  /* Bumped when comment mode asks the feedback drawer to close (Esc with nothing left open). */
  const [drawerCloseRequest, setDrawerCloseRequest] = useState(0);
  /* Whether comments were available last render; compared below, past the early returns (a hook can't live there). */
  const [seenCommentModeAvailable, setSeenCommentModeAvailable] = useState(false);
  /* The feedback drawer's Comments tab body, where comment mode lists the comments. */
  const [commentsListSlot, setCommentsListSlot] = useState<HTMLDivElement | null>(null);
  const deepLinkHandled = useRef(false);
  // Every comment, Shipped included — the button, the Comment tab and the comments panel
  // show the same total (prototype). One item may carry several pins (older feedback).
  const commentCount = useMemo(
    () => new Set(feedbackPins.pins.map((pin) => pin.feedbackUid)).size,
    [feedbackPins.pins],
  );

  const goToAppPage = useCallback(
    (pagePath: string) => {
      const frame = iframeRef.current;
      if (!frame || !appOrigin) return;
      /* A cross-origin frame can still be sent somewhere; the app then reports the
         route itself. Set it here too, for apps that never report one. */
      setCurrentAppPath(pagePath);
      frame.src = `${appOrigin}${pagePath}`;
    },
    [appOrigin],
  );

  // `?feedback=<uid>` (from the feedback list's "Show on page"): once the pins
  // are in, turn the overlay on at that feedback's first pin, on its page. The
  // param is dropped either way, so a refresh doesn't replay it.
  const deepLinkFeedback = searchParams.get('feedback');
  useEffect(() => {
    if (deepLinkHandled.current || !deepLinkFeedback || overlayScope === null || feedbackPins.isLoading) return;
    if (frameStatus !== 'live') return;
    deepLinkHandled.current = true;
    const first = feedbackPins.pins.find((pin) => pin.feedbackUid === deepLinkFeedback);
    if (first) {
      setCommentModeOn(true);
      setOpenFeedbackPin(first.uid);
      if (normalizeAppPath(first.pagePath) !== normalizeAppPath(appPathRef.current ?? currentAppPath ?? '/')) {
        goToAppPage(first.pagePath);
      }
    }
    const params = new URLSearchParams(window.location.search);
    params.delete('feedback');
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [
    deepLinkFeedback,
    overlayScope,
    feedbackPins.isLoading,
    feedbackPins.pins,
    frameStatus,
    currentAppPath,
    goToAppPage,
  ]);

  // What the feedback dialog records with a report: where it was left, on what.
  const getFeedbackContext = useCallback((): FeedbackContext | null => {
    if (!appOrigin) return null;
    const frame = iframeRef.current;
    const href = window.location.href;
    return {
      env: selectedEnv,
      appPath: (appPathRef.current ?? currentAppPath ?? '/').slice(0, 2000),
      labosUrl: href.length <= 2000 ? href : `${window.location.origin}${window.location.pathname}`.slice(0, 2000),
      viewport: {
        w: Math.round(frame?.clientWidth ?? window.innerWidth),
        h: Math.round(frame?.clientHeight ?? window.innerHeight),
      },
      pixelRatio: Math.min(10, window.devicePixelRatio || 1),
      touch: window.matchMedia?.('(pointer: coarse)').matches ?? false,
      userAgent: navigator.userAgent.slice(0, 500),
      bridge:
        elementPins.status === 'ready' ? { version: BRIDGE_VERSION, capabilities: elementPins.capabilities } : null,
    };
  }, [appOrigin, selectedEnv, currentAppPath, elementPins.status, elementPins.capabilities]);

  const handleIframeLoad = () => {
    elementPins.onFrameLoad();
    if (!app || iframeTracked.current === app.uid) return;
    iframeTracked.current = app.uid;
    analytics.onIframeLoaded(app.uid, app.name);
    void recordAiAppView(app.uid);
  };

  // Don't swap to a loading shell when cached app data is already present —
  // that would unmount AppSecretsPanel and discard in-progress secret drafts.
  if (isLoading && !app) {
    return <div className={s.state}>Loading app…</div>;
  }

  if (isError && !app) {
    return <div className={s.state}>Unable to load this app. Please try again later.</div>;
  }

  if (errorKind === 'forbidden' && !app) {
    return (
      <div className={s.state}>
        <div className={s.privateState}>
          <span className={s.privateStateIcon}>
            <LockIcon size={20} />
          </span>
          <h1 className={s.privateStateTitle}>This app is private</h1>
          <p className={s.privateStateText}>
            Only its owner and the people they add can open it. Ask the owner to add you.
          </p>
          <Link href="/pl-infra/ai-apps" className={s.privateStateLink}>
            Back to AI Apps
          </Link>
        </div>
      </div>
    );
  }

  if ((!isLoading && !appUrl) || !app) {
    return <div className={s.state}>App not found.</div>;
  }

  // Trust the server-computed flag (creator or directory admin); the uid
  // comparison is only a fallback for API versions without `canManage` — the
  // login cookie's uid can go stale (e.g. after a dev DB reseed).
  const isCreator = app.canManage ?? (!!currentUser?.uid && currentUser.uid === app.member?.uid);

  // Shown both for an app that genuinely isn't deployed yet (needsSetup) and
  // for a deploy in progress or failed with nothing serving — a 'warning'
  // failure (previous revision still up) renders the normal layout instead.
  const showSetupCard =
    selectedEnv !== 'preview' && (needsSetup || (deployFailed && failureKind !== 'warning') || deployInProgress);

  // Comment mode needs the app's bridge (kit 1.15+) and a running frame; without
  // them the feedback button stays today's door (pins or the dialog).
  const commentModeAvailable =
    overlayScope !== null && elementPins.status === 'ready' && frameStatus === 'live' && !showSetupCard;
  // Comments dropping out ends comment mode: left on, the drawer would reopen by itself on Comments
  // when they come back. Only the drop counts — the deep link turns the mode on before they arrive.
  if (seenCommentModeAvailable !== commentModeAvailable) {
    setSeenCommentModeAvailable(commentModeAvailable);
    if (!commentModeAvailable) {
      setCommentModeOn(false);
      setOpenFeedbackPin(null);
    }
  }

  // Close a card action; if the deployment modal was opened via the
  // `?settings=deployment` deep link, drop the param so a refresh/back doesn't
  // reopen it. replaceState rather than router.replace: a soft navigation to
  // the subpage URL remounts the page subtree and reloads the frame.
  const closeAction = () => {
    setAction(null);
    // Live URL, not the hook snapshot: route sync writes app params via
    // replaceState, which does not update useSearchParams. Reading the hook
    // here would drop those params when the modal closes.
    const params = new URLSearchParams(window.location.search);
    if (!params.has('settings')) return;
    params.delete('settings');
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  };

  const openFailureLogs = (source: 'detail-banner' | 'detail-error-card') => {
    analytics.onDeploymentLogsOpened({
      appUid: app.uid,
      appName: app.name,
      environment: 'prod',
      source,
      variant: failureKind ?? undefined,
    });
    setAction('logs');
  };

  const setupCard = (
    <div className={s.setupPage}>
      <div className={s.setupContent}>
        <div className={s.setupCard}>
          <div className={s.setupHeader}>
            <h1 className={s.setupTitle}>{app.name}</h1>
            <span className={s.statusBadge} data-status={app.status}>
              Prod {aiAppStatusLabel(prodTarget?.status ?? app.status)}
              {previewRow ? ` · Preview ${aiAppStatusLabel(previewRow.status)}` : ''}
            </span>
            {isPrivateAiApp(app) && <span className={s.privateBadge}>Private</span>}
          </div>
          {app.description && <p className={s.setupDescription}>{app.description}</p>}
          <AiAppTagChips tags={app.tags} />
          {/* Failure notes are runner output (stack fragments, image names) — creator/admin only. */}
          {app.status === 'ERROR' && app.notes && isCreator && (
            <p className={s.setupError}>Last deploy failed: {app.notes}</p>
          )}
          {deployInProgress ? (
            <div className={s.progress}>
              <div className={s.progressBar}>
                <div className={s.progressIndicator} />
              </div>
              <p className={s.progressText}>
                A deploy is in progress — this page updates automatically once it finishes.
              </p>
            </div>
          ) : isCreator ? (
            <>
              {deployFailed && (
                <button type="button" className={s.setupSeeLogs} onClick={() => openFailureLogs('detail-error-card')}>
                  See logs
                </button>
              )}
              <AppSecretsPanel app={app} onDeployingChange={setIsRedeploying} />
            </>
          ) : failureKind === 'danger' ? (
            // Nothing has ever served, but failure details stay creator-only —
            // visitors get the neutral "nothing to preview" framing.
            <div className={s.notDeployedCard}>
              <h2 className={s.notDeployedTitle}>Not deployed</h2>
              <p className={s.setupInfo}>
                This app has never been built successfully, so there is no running version to preview.
              </p>
            </div>
          ) : (
            <p className={s.setupInfo}>
              {deployFailed
                ? `The last deploy of this app failed. Only ${app.member?.name ?? 'its creator'} or an admin can retry it.`
                : `This app is not deployed yet. Only ${app.member?.name ?? 'its creator'} can provide the required values and deploy it.`}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFrameArea = () => {
    if (selectedEnv === 'preview' && !appUrl) {
      return (
        <div className={s.frameState}>
          <div className={s.progress}>
            <p className={s.progressTitle}>
              {previewTargetRow?.status === 'DEPLOYING' ? 'Deploying preview' : 'Preview is not deployed yet'}
            </p>
            <p className={s.progressText}>
              {previewTargetRow?.status === 'DEPLOYING'
                ? 'A deploy is in progress — this page updates automatically once it finishes.'
                : 'Switch back to Production, or open settings to deploy this environment.'}
            </p>
          </div>
        </div>
      );
    }

    if (isRedeploying) {
      return (
        <div className={s.frameState}>
          <div className={s.progress}>
            <div className={s.progressBar}>
              <div className={s.progressIndicator} />
            </div>
            <p className={s.progressTitle}>Redeploying the app</p>
            <p className={s.progressText}>This usually takes a couple of minutes — you can keep this page open.</p>
          </div>
        </div>
      );
    }

    if (frameStatus === 'checking') {
      return (
        <div className={s.frameState}>
          <div className={s.progress}>
            <div className={s.progressBar}>
              <div className={s.progressIndicator} />
            </div>
            <p className={s.progressTitle}>Starting the app</p>
            <p className={s.progressText}>Waiting for the app to come online…</p>
          </div>
        </div>
      );
    }

    if (frameStatus === 'down') {
      return (
        <div className={s.frameState}>
          <div className={s.progress}>
            <p className={s.progressTitle}>The app isn’t responding right now</p>
            <p className={s.progressText}>
              Something went wrong while loading this app. It may still be starting up — please try again in a moment.
            </p>
            <button type="button" className={s.retryButton} onClick={() => setRetryToken((t) => t + 1)}>
              Try again
            </button>
          </div>
        </div>
      );
    }

    return (
      <iframe
        // Remount after every deploy so the frame reloads instead of keeping
        // whatever it captured before the restart.
        key={deployGeneration}
        ref={iframeRef}
        className={s.iframe}
        src={frameSrc}
        title={app.name}
        allow="fullscreen"
        onLoad={handleIframeLoad}
      />
    );
  };

  const appHeader = (
    <div className={s.topBar}>
      <Link href="/pl-infra/ai-apps" className={s.backLink}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11 14L5 8L11 2"
            stroke="#5E718D"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
        Back
      </Link>
      <div className={s.topBarActions}>
        {canOpenPreview && (
          <div className={s.envSwitch} role="tablist" aria-label="App environment">
            <button
              type="button"
              role="tab"
              aria-selected={selectedEnv === 'prod'}
              className={selectedEnv === 'prod' ? s.envOn : s.envOff}
              onClick={() => {
                if (selectedEnv === 'prod') return;
                analytics.onEnvironmentSelected({ environment: 'prod', surface: 'detail' });
                setPreviewEnv('prod');
              }}
            >
              Production
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={selectedEnv === 'preview'}
              className={selectedEnv === 'preview' ? s.envOn : s.envOff}
              onClick={() => {
                if (selectedEnv === 'preview') return;
                analytics.onEnvironmentSelected({ environment: 'preview', surface: 'detail' });
                setPreviewEnv('preview');
              }}
            >
              Preview
            </button>
          </div>
        )}
        <span className={s.envMeta}>{aiAppStatusLabel(previewTarget?.status ?? '')}</span>
        {isPrivateAiApp(app) && (
          <span className={s.privateBadge} title="Only the owner and people they add can see this app">
            <LockIcon size={12} />
            Private
          </span>
        )}
        {hasPrd(app) && (
          <Button
            style="border"
            variant="neutral"
            size="xxs"
            className={s.topBarBtn}
            onClick={() => setShowDetails(true)}
            aria-label={`App details for ${app.name}`}
          >
            <DocumentIcon aria-hidden />
            App Details
          </Button>
        )}
        {canLikelyManage(app.member.uid) && (
          <AppActionsMenu
            app={app}
            onEdit={() => setAction('edit')}
            onAccess={() => setAction('access')}
            onDeployment={() => setAction('deployment')}
            onLogs={() => {
              analytics.onDeploymentLogsOpened({
                appUid: app.uid,
                appName: app.name,
                environment: 'prod',
                source: 'menu',
              });
              setAction('logs');
            }}
            onDelete={() => setAction('delete')}
          />
        )}
      </div>
    </div>
  );

  const normalLayout = (
    <div className={s.root}>
      {appHeader}
      {/* The previous revision still serves — the app below works, only its
          creator needs to know the latest change didn't ship. Hidden during the
          creator's own redeploy (the frame area shows that story). */}
      {isCreator && failureKind === 'warning' && !isRedeploying && selectedEnv !== 'preview' && (
        <div className={s.warningBanner}>
          <span className={s.warningBannerLabel}>Latest deploy didn&apos;t ship</span>
          <button type="button" className={s.warningBannerButton} onClick={() => openFailureLogs('detail-banner')}>
            See logs
          </button>
        </div>
      )}
      {renderFrameArea()}
    </div>
  );

  // One return for both page states, with every modal AFTER the branch in a
  // stable tree position: a status flip (normal ↔ setup card, e.g. a redeploy
  // settling warning → danger) must never unmount an open modal mid-result.
  return (
    <>
      {showSetupCard ? (
        <>
          {canOpenPreview && appHeader}
          {setupCard}
        </>
      ) : (
        normalLayout
      )}
      {/* Floats over both branches, for the same reason the modals sit here: it
          owns an open dialog, and a status flip must not unmount it mid-typing.
          It also gives the setup / deploying / failed states a feedback door —
          they had none, and a failed deploy is when people most want one. */}
      <FloatingFeedbackButton
        appUid={app.uid}
        appName={app.name}
        feedbackEnabled={app.feedbackEnabled !== false}
        elementPins={SHOW_AI_APPS_ELEMENT_PINS ? elementPins : undefined}
        iframeRef={iframeRef}
        getContext={getFeedbackContext}
        commentMode={
          commentModeAvailable
            ? {
                available: true,
                active: commentModeOn,
                count: commentCount,
                onOpen: () => setCommentModeOn(true),
                onClose: () => {
                  setCommentModeOn(false);
                  setOpenFeedbackPin(null);
                },
                body: <div ref={setCommentsListSlot} className={s.commentsListSlot} />,
                closeRequest: drawerCloseRequest,
                collapsed: placing,
              }
            : undefined
        }
      />
      {commentModeAvailable && (
        <CommentMode
          appUid={app.uid}
          appName={app.name}
          iframeRef={iframeRef}
          appOrigin={appOrigin}
          frameKey={deployGeneration}
          pins={feedbackPins.pins}
          canManage={canManageApp}
          currentPath={currentAppPath}
          currentEnv={selectedEnv}
          active={commentModeOn}
          openPinUid={openFeedbackPin}
          onOpenPinChange={setOpenFeedbackPin}
          onGoToPage={goToAppPage}
          onExit={() => {
            setCommentModeOn(false);
            setOpenFeedbackPin(null);
            setDrawerCloseRequest((n) => n + 1);
          }}
          elementPins={elementPins}
          touch={isPhone}
          placing={placing}
          onPlacingChange={setPlacing}
          viewerName={currentUser?.name ?? 'You'}
          listSlot={commentsListSlot}
          viewer={
            currentUser?.uid
              ? { uid: currentUser.uid, name: currentUser.name ?? 'You', image: currentUser.profileImageUrl ?? null }
              : null
          }
          getContext={getFeedbackContext}
          isAdmin={isDirectoryAdmin}
        />
      )}
      {showDetails && (
        <AiAppDetailsModal
          isOpen
          uid={app.uid}
          appName={app.name}
          prdUrl={app.prd as string}
          onClose={() => setShowDetails(false)}
        />
      )}
      {action === 'edit' && <EditAiAppModal app={app} onClose={closeAction} />}
      {action === 'access' && (
        <ManageAccessModal app={app} onClose={closeAction} onRedeploy={() => setAction('deployment')} />
      )}
      {action === 'deployment' && (
        <DeploymentSettingsModal app={app} onClose={closeAction} onDeployingChange={setIsRedeploying} />
      )}
      {/* Conditional render is load-bearing: unmounting on close aborts the
          modal's in-flight log fetches (its queryFn consumes the signal). */}
      {action === 'logs' && <DeploymentLogsModal app={app} onClose={closeAction} />}
      {action === 'delete' && (
        <DeleteAiAppDialog
          app={app}
          onClose={() => setAction(null)}
          onDeleteSucceeded={() => router.push('/pl-infra/ai-apps')}
        />
      )}
    </>
  );
}
