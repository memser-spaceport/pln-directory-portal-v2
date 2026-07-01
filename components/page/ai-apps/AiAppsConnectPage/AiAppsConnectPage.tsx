'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/common/Button/Button';
import { useCurrentUserStore } from '@/services/auth/store';
import {
  approveConnectSession,
  ConnectSession,
  ConnectStatus,
  fetchConnectSession,
} from '@/services/ai-apps/ai-apps.service';

import s from './AiAppsConnectPage.module.scss';

type View = 'loading' | 'signedOut' | 'invalid' | 'pending' | ConnectStatus | 'error';

export function AiAppsConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') ?? '';

  const { currentUser, isHydrated } = useCurrentUserStore();
  const [session, setSession] = useState<ConnectSession | null>(null);
  const [view, setView] = useState<View>(() => (sessionId ? 'loading' : 'invalid'));
  const [isApproving, setIsApproving] = useState(false);

  // Load the session once we know its id (public — works signed-in or not).
  useEffect(() => {
    if (!sessionId) {
      return;
    }
    let active = true;
    fetchConnectSession(sessionId).then((result) => {
      if (!active) return;
      if (!result) {
        setView('invalid');
        return;
      }
      setSession(result);
      // A terminal status from the backend wins; otherwise it's pending.
      if (result.status === 'pending') {
        setView(isHydrated && !currentUser ? 'signedOut' : 'pending');
      } else {
        setView(result.status);
      }
    });
    return () => {
      active = false;
    };
  }, [sessionId, currentUser, isHydrated]);

  const onSignIn = useCallback(() => {
    router.push(`${window.location.pathname}${window.location.search}#login`, { scroll: false });
  }, [router]);

  const onApprove = useCallback(async () => {
    setIsApproving(true);
    const result = await approveConnectSession(sessionId);
    setIsApproving(false);
    setView(result?.status ?? 'error');
  }, [sessionId]);

  const code = session?.userCode;
  const client = session?.clientName;

  return (
    <div className={s.page}>
      <div className={s.card}>
        <h1 className={s.title}>Connect your AI agent</h1>

        {view === 'loading' && <p className={s.body}>Loading…</p>}

        {view === 'invalid' && (
          <p className={s.body}>This connect link is invalid or has expired. Ask your agent to start a new deploy and open the fresh link.</p>
        )}

        {view === 'signedOut' && (
          <>
            <p className={s.body}>
              Sign in to LabOS to authorize {client ? <strong>{client}</strong> : 'your agent'} to deploy AI Apps on your behalf.
            </p>
            {code && <p className={s.codeNote}>Your agent shows this code: <span className={s.code}>{code}</span></p>}
            <Button size="m" onClick={onSignIn}>Sign in to continue</Button>
          </>
        )}

        {view === 'pending' && (
          <>
            <p className={s.body}>
              {client ? <strong>{client}</strong> : 'Your agent'} is requesting permission to deploy AI Apps on your behalf. This grants a deploy credential that expires in about an hour.
            </p>
            {code && (
              <p className={s.codeNote}>
                Confirm this matches the code shown by your agent: <span className={s.code}>{code}</span>
              </p>
            )}
            <div className={s.actions}>
              <Button size="m" onClick={onApprove} disabled={isApproving}>
                {isApproving ? 'Approving…' : 'Approve'}
              </Button>
            </div>
          </>
        )}

        {view === 'approved' && (
          <p className={s.body}>
            <span className={s.success}>✓ Connected.</span> You can return to your agent — it now has a short-lived credential to deploy your app.
          </p>
        )}

        {view === 'denied' && (
          <p className={s.body}>
            <span className={s.error}>You don’t have access.</span> Deploying AI Apps requires the <code>ai_apps.write</code> permission. Ask a PL Infra admin for access, then try again.
          </p>
        )}

        {view === 'expired' && (
          <p className={s.body}>This connect link has expired. Ask your agent to start a new deploy and open the fresh link.</p>
        )}

        {view === 'error' && (
          <p className={s.body}>Something went wrong approving this session. Please try again.</p>
        )}
      </div>
    </div>
  );
}
