'use client';

import { Button } from '@/components/common/Button';
import { useLoginRedirect } from '@/components/core/login/utils/loginRedirect';
import { EVENTS_MINE_PATH } from '@/utils/events-submit';

import s from './MySubmissionsSignIn.module.scss';

/** The signed-out state: "Sign in" opens the app's sign-in on this page, which returns here. */
export function MySubmissionsSignIn() {
  const goToLogin = useLoginRedirect();

  return (
    <div className={s.root}>
      <p className={s.text}>Sign in to see the events you submitted.</p>
      <Button size="s" onClick={() => goToLogin({ returnTo: EVENTS_MINE_PATH })}>
        Sign in
      </Button>
    </div>
  );
}
