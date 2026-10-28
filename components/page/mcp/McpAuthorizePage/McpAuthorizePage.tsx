'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';

import { useMcpAnalytics, type McpConnectErrorKind, type McpConnectView } from '@/analytics/mcp.analytics';
import { Button } from '@/components/common/Button/Button';
import { Checkbox } from '@/components/common/Checkbox';
// The settings card frame, as the LAB-2948 prototype's consent screen uses it.
import tabCss from '@/components/page/connected-accounts/ConnectedAccounts.module.scss';
import { ClientLogo, clientKeyFromName } from '@/components/page/settings/mcp/ClientLogo';
import { useCurrentUserStore } from '@/services/auth/store';
import { approveMcpOAuth, fetchMcpOAuthClient } from '@/services/mcp/mcp.service';
import { useMcpAccess } from '@/services/rbac/hooks/useMcpAccess';
import { SHOW_MCP_CONNECTIONS_PAGE } from '@/utils/mcp';

import s from './McpAuthorizePage.module.scss';

type View = McpConnectView | 'loading';

type ClientCheck =
  | { state: 'loading' }
  | { state: 'not_found' }
  | { state: 'invalid_redirect' }
  | { state: 'failed' }
  | { state: 'ready'; clientName: string; redirectHost: string | null };

function redirectUrl(uri: string): URL | null {
  try {
    return new URL(uri);
  } catch {
    return null;
  }
}

function isHttpRedirect(url: URL): boolean {
  return url.protocol === 'http:' || url.protocol === 'https:';
}

function trustedRedirectHost(
  redirectUri: string,
  redirectHost: string | null,
  registered: boolean,
): { ok: true; redirectHost: string | null } | { ok: false } {
  if (!registered) {
    return { ok: false };
  }
  const url = redirectUrl(redirectUri);
  if (!url) {
    return { ok: false };
  }
  if (!isHttpRedirect(url)) {
    return redirectHost === null ? { ok: true, redirectHost: null } : { ok: false };
  }
  if (!redirectHost || url.hostname.toLowerCase() !== redirectHost.toLowerCase()) {
    return { ok: false };
  }
  return { ok: true, redirectHost };
}

export function McpAuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analytics = useMcpAnalytics();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { canConnect, isLoading: accessLoading } = useMcpAccess();
  const [isApproving, setIsApproving] = useState(false);
  // Every connection starts read only (LAB-2995); the member only acknowledges what read already exposes.
  const [acknowledged, setAcknowledged] = useState(false);
  const [viewOverride, setViewOverride] = useState<View | null>(null);
  const [clientCheck, setClientCheck] = useState<ClientCheck>({ state: 'loading' });
  const trackedViewRef = useRef<string | null>(null);

  const clientId = searchParams.get('client_id') ?? '';
  const redirectUri = searchParams.get('redirect_uri') ?? '';
  const codeChallenge = searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? 'S256';
  const state = searchParams.get('state') ?? undefined;
  const resource = searchParams.get('resource') ?? undefined;

  const paramsValid = Boolean(clientId && redirectUri && codeChallenge && codeChallengeMethod === 'S256');
  const requestKey = paramsValid ? `${clientId}\0${redirectUri}` : '';
  const [seenRequestKey, setSeenRequestKey] = useState(requestKey);
  if (seenRequestKey !== requestKey) {
    setSeenRequestKey(requestKey);
    setClientCheck({ state: 'loading' });
    setViewOverride(null);
  }

  useEffect(() => {
    if (!paramsValid) {
      return;
    }
    let cancelled = false;
    fetchMcpOAuthClient(clientId, redirectUri).then((result) => {
      if (cancelled) {
        return;
      }
      if ('error' in result) {
        setClientCheck({ state: result.error === 'not_found' ? 'not_found' : 'failed' });
        return;
      }
      const trusted = trustedRedirectHost(redirectUri, result.redirect_host, result.redirect_uri_registered);
      if (!trusted.ok) {
        setClientCheck({ state: 'invalid_redirect' });
        return;
      }
      setClientCheck({ state: 'ready', clientName: result.client_name, redirectHost: trusted.redirectHost });
    });
    return () => {
      cancelled = true;
    };
  }, [paramsValid, clientId, redirectUri]);

  const view: View = useMemo(() => {
    if (viewOverride) {
      return viewOverride;
    }
    if (!paramsValid) {
      return 'invalid';
    }
    if (clientCheck.state === 'loading') {
      return 'loading';
    }
    if (clientCheck.state !== 'ready') {
      return 'error';
    }
    if (!isHydrated || accessLoading) {
      return 'loading';
    }
    if (!currentUser) {
      return 'signedOut';
    }
    if (!canConnect) {
      return 'denied';
    }
    return 'pending';
  }, [viewOverride, paramsValid, clientCheck, isHydrated, accessLoading, currentUser, canConnect]);

  useEffect(() => {
    if (view === 'loading') return;
    const key = `${clientId}:${view}:${clientCheck.state}`;
    if (trackedViewRef.current === key) return;
    trackedViewRef.current = key;
    analytics.onConnectPageViewed({ view, clientId });
    if (view === 'denied') {
      analytics.onConnectDenied({ clientId, reason: 'missing_permission' });
    }
    const errorKind: McpConnectErrorKind | null =
      clientCheck.state === 'not_found'
        ? 'client_unknown'
        : clientCheck.state === 'invalid_redirect'
          ? 'redirect_invalid'
          : null;
    if (errorKind) {
      analytics.onConnectError({ clientId, errorKind });
    }
  }, [view, clientId, clientCheck.state, analytics]);

  const onSignIn = useCallback(() => {
    analytics.onConnectSignInClicked({ clientId });
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  }, [router, analytics, clientId]);

  const denyRedirect = useCallback(() => {
    analytics.onConnectDenied({ clientId, reason: 'user_denied' });
    if (clientCheck.state !== 'ready' || !clientCheck.redirectHost) {
      setViewOverride('closeTab');
      return;
    }
    const url = redirectUrl(redirectUri);
    if (!url || !isHttpRedirect(url) || url.hostname.toLowerCase() !== clientCheck.redirectHost.toLowerCase()) {
      analytics.onConnectError({ clientId, errorKind: 'redirect_invalid' });
      setViewOverride('error');
      return;
    }
    url.searchParams.set('error', 'access_denied');
    if (state) {
      url.searchParams.set('state', state);
    }
    window.location.assign(url.toString());
  }, [redirectUri, state, analytics, clientId, clientCheck]);

  const onApprove = useCallback(async () => {
    setIsApproving(true);
    const result = await approveMcpOAuth({
      clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod: 'S256',
      state,
      resource,
      acknowledgedContactDetails: true,
    });
    setIsApproving(false);
    if ('redirectUrl' in result) {
      analytics.onConnectApproved({ clientId });
      window.location.assign(result.redirectUrl);
      return;
    }
    if (result.error === 'forbidden') {
      setViewOverride('denied');
      return;
    }
    analytics.onConnectError({ clientId, errorKind: 'approve_failed' });
    setViewOverride('error');
  }, [clientId, redirectUri, codeChallenge, state, resource, analytics]);

  const clientName = clientCheck.state === 'ready' ? clientCheck.clientName : '';
  const redirectHost = clientCheck.state === 'ready' ? clientCheck.redirectHost : null;
  const onAcknowledge = useCallback(
    (checked: boolean) => {
      setAcknowledged(checked);
      if (checked) analytics.onContactAckChecked({ clientId });
    },
    [analytics, clientId],
  );

  const errorCopy =
    clientCheck.state === 'not_found' || clientCheck.state === 'invalid_redirect'
      ? 'This connect link is not valid. Ask your agent to try again.'
      : 'Something went wrong completing this connection. Please try again.';

  if (view === 'pending') {
    // The LAB-2948 prototype's consent screen (Permissions.tsx ConsentScreen), on production parts.
    return (
      <div className={s.consentPage}>
        <div className={clsx(tabCss.card, s.consentCard)}>
          <div className={s.consentHead}>
            <img
              src="/images/email/digest-logo-protocol-labs.png"
              width={130}
              height={32}
              alt="Protocol Labs"
              className={s.consentLogo}
            />
            <div className={s.consentTitleRow}>
              <span className={s.agentMark} aria-hidden>
                <ClientLogo client={clientKeyFromName(clientName)} size={18} />
              </span>
              <h1 className={s.consentTitle}>Connect {clientName} to LabOS</h1>
            </div>
          </div>
          <div className={s.consentBody}>
            <div className={s.consentSection}>
              <span className={s.label}>Read only (default)</span>
              <p className={s.help}>
                {clientName} can view what you can view in LabOS: members, teams, projects, the forum, news and events.
                You can give it more access or less at any time in Settings
                {SHOW_MCP_CONNECTIONS_PAGE ? ' → MCP connections' : ''}.
              </p>
              {redirectHost ? (
                <p className={s.help}>
                  This page returns to <strong>{redirectHost}</strong>.
                </p>
              ) : null}
            </div>
            <div className={s.consentNotice}>
              <p className={s.help}>
                That includes other members’ contact details, such as email, Telegram and LinkedIn. Keep what it reads
                inside the network.
              </p>
              <label className={s.ackRow}>
                <Checkbox checked={acknowledged} onChange={onAcknowledge} disabled={isApproving} />
                <span>I understand {clientName} can see other members’ contact details.</span>
              </label>
            </div>
          </div>
          <div className={s.consentFoot}>
            <Button
              size="m"
              variant="neutral"
              style="border"
              className={s.btn}
              onClick={denyRedirect}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              size="m"
              variant="primary"
              className={s.btn}
              disabled={!acknowledged || isApproving}
              onClick={onApprove}
            >
              {isApproving ? 'Connecting…' : 'Connect'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <h1 className={s.title}>Connect an AI agent</h1>

        {view === 'loading' && <p className={s.body}>Loading…</p>}

        {view === 'invalid' && (
          <p className={s.body}>This connect link is missing required OAuth parameters. Ask your agent to try again.</p>
        )}

        {view === 'signedOut' && (
          <>
            <p className={s.body}>
              Sign in to LabOS to allow <strong>{clientName}</strong> to access LabOS as you.
              {redirectHost ? (
                <>
                  {' '}
                  This page returns to <strong>{redirectHost}</strong>.
                </>
              ) : null}
            </p>
            <Button size="m" onClick={onSignIn}>
              Sign in to continue
            </Button>
          </>
        )}

        {view === 'denied' && (
          <p className={s.body}>
            <span className={s.error}>You don’t have access.</span> Connecting an AI agent requires the{' '}
            <code>mcp.connect</code> permission. Ask a Directory admin for access, then try again.
          </p>
        )}

        {view === 'closeTab' && <p className={s.body}>You can close this tab.</p>}

        {view === 'error' && <p className={s.body}>{errorCopy}</p>}
      </div>
    </div>
  );
}
