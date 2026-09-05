'use client';

import { ReactNode } from 'react';

import { useCurrentUserStore } from '@/services/auth/store';
import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';

import styles from './plaa-profile-access-guard.module.css';

interface PlaaProfileAccessGuardProps {
  readonly children: ReactNode;
}

/**
 * The Profile page carries a member's own balance and contribution history, so
 * it's restricted to PLAA members (`plaa.access`) rather than every logged-in
 * LabOS member. Fails closed: a failed permission lookup denies rather than
 * renders.
 *
 * This gates page visibility, not the data — the underlying endpoints are
 * authenticated and /me-scoped but don't check `plaa.access` server-side.
 */
export function PlaaProfileAccessGuard({ children }: PlaaProfileAccessGuardProps) {
  const { currentUser, isHydrated } = useCurrentUserStore();
  const { canView, isLoading, isError } = usePlaaAccess();

  // Rendering the refusal mid-fetch would flash a false negative at a member
  // who does have access.
  if (isLoading) {
    return null;
  }

  // A guest hasn't been denied, they just haven't identified themselves. Fall
  // through to the page's own onboarding card, which carries the login link —
  // the refusal below is a dead end with no way to sign in.
  if (isHydrated && !currentUser) {
    return <>{children}</>;
  }

  if (isError || !canView) {
    return (
      <div className={styles.noAccess}>
        <h2 className={styles.title}>You don&apos;t have access to this page</h2>
        <p className={styles.body}>
          The Alignment Asset profile is available to PLAA members. If you think you should have access, contact the
          Alignment Asset team.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
