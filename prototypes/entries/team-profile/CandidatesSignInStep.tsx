'use client';

import { Button } from '@/components/common/Button';

import s from './CandidatesSignInStep.module.scss';

interface Props {
  teamName: string;
  roleTitle?: string;
  /** The person the email's card named — said back, so the lead knows the click held. */
  personName?: string;
  onSignIn: () => void;
}

/**
 * The step between a card in the suggested-candidates email and the
 * Candidates page, for a lead who is signed out (LAB-2819; production's
 * return-to-the-same-person is LAB-2818).
 *
 * **Mocked.** Production opens Privy and comes back to the same URL; here
 * Sign in just flips the prototype to signed in, with no auth call.
 *
 * **One door, not the usual pair.** A signed-out ask normally offers Sign up
 * and Sign in together (the navbar's cluster). This one is read only by a
 * team lead the email was sent to — someone who by definition has an account
 * — so Sign up would be a door to nowhere.
 *
 * **It names what is waiting.** The person and the role from the link, so the
 * step reads as "one step from Inês", not as a wall.
 */
export function CandidatesSignInStep({ teamName, roleTitle, personName, onSignIn }: Props) {
  return (
    <div className={s.page}>
      <div className={s.card}>
        <h1 className={s.title}>Sign in to see your candidates</h1>
        <p className={s.body}>
          {personName ? (
            <>
              <strong>{personName}</strong> and the other suggested candidates
            </>
          ) : (
            'The suggested candidates'
          )}
          {roleTitle ? (
            <>
              {' '}
              for <strong>{roleTitle}</strong>
            </>
          ) : null}{' '}
          are only shown to {teamName}’s leads.
        </p>
        <Button size="m" style="fill" variant="primary" className={s.cta} onClick={onSignIn}>
          Sign in
        </Button>
        <p className={s.hint}>You’ll come back to this page after signing in.</p>
      </div>
    </div>
  );
}
