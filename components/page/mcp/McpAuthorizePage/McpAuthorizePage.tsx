'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import { useCurrentUserStore } from '@/services/auth/store';
import { useMcpAccess } from '@/services/rbac/hooks/useMcpAccess';
import { approveMcpOAuth } from '@/services/mcp/mcp.service';

import s from './McpAuthorizePage.module.scss';

type View = 'loading' | 'invalid' | 'signedOut' | 'pending' | 'denied' | 'error';

export function McpAuthorizePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { canConnect, isLoading: accessLoading } = useMcpAccess();
  const [isApproving, setIsApproving] = useState(false);
  const [viewOverride, setViewOverride] = useState<View | null>(null);

  const clientId = searchParams.get('client_id') ?? '';
  const redirectUri = searchParams.get('redirect_uri') ?? '';
  const codeChallenge = searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? 'S256';
  const state = searchParams.get('state') ?? undefined;
  const resource = searchParams.get('resource') ?? undefined;
  const clientName = searchParams.get('client_name') || 'this agent';

  const paramsValid = Boolean(clientId && redirectUri && codeChallenge && codeChallengeMethod === 'S256');

  const view: View = useMemo(() => {
    if (viewOverride) {
      return viewOverride;
    }
    if (!paramsValid) {
      return 'invalid';
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
  }, [viewOverride, paramsValid, isHydrated, accessLoading, currentUser, canConnect]);

  const onSignIn = useCallback(() => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  }, [router]);

  const denyRedirect = useCallback(() => {
    try {
      const url = new URL(redirectUri);
      url.searchParams.set('error', 'access_denied');
      if (state) {
        url.searchParams.set('state', state);
      }
      window.location.assign(url.toString());
    } catch {
      setViewOverride('error');
    }
  }, [redirectUri, state]);

  const onApprove = useCallback(async () => {
    setIsApproving(true);
    const result = await approveMcpOAuth({
      clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod: 'S256',
      state,
      resource,
    });
    setIsApproving(false);
    if ('redirectUrl' in result) {
      window.location.assign(result.redirectUrl);
      return;
    }
    setViewOverride(result.error === 'forbidden' ? 'denied' : 'error');
  }, [clientId, redirectUri, codeChallenge, state, resource]);

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
            </p>
            <Button size="m" onClick={onSignIn}>
              Sign in to continue
            </Button>
          </>
        )}

        {view === 'pending' && (
          <>
            <p className={s.body}>
              Allow <strong>{clientName}</strong> to access LabOS as you.
            </p>
            <div className={s.actions}>
              <Button size="m" style="border" variant="neutral" onClick={denyRedirect} disabled={isApproving}>
                Deny
              </Button>
              <Button size="m" onClick={onApprove} disabled={isApproving}>
                {isApproving ? 'Allowing…' : 'Allow'}
              </Button>
            </div>
          </>
        )}

        {view === 'denied' && (
          <p className={s.body}>
            <span className={s.error}>You don’t have access.</span> Connecting an AI agent requires the{' '}
            <code>mcp.connect</code> permission. Ask a Directory admin for access, then try again.
          </p>
        )}

        {view === 'error' && (
          <p className={s.body}>Something went wrong completing this connection. Please try again.</p>
        )}
      </div>
    </div>
  );
}
