'use client';

import { ReactNode } from 'react';

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
 */
export function PlaaProfileAccessGuard({ children }: PlaaProfileAccessGuardProps) {
  const { canView, isLoading, isError } = usePlaaAccess();

  // Rendering the refusal mid-fetch would flash a false negative at a member
  // who does have access.
  if (isLoading) {
    return null;
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
