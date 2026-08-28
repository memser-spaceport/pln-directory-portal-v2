'use client';

import { LoginBtn } from '@/components/core/navbar/components/LoginBtn';
import { useHomeAnalytics } from '@/analytics/home.analytics';

import s from './Welcome.module.scss';

interface Props {
  teamCount?: number;
}

function Count({ value }: { value: number }) {
  return <span className={s.titleHighlight}>{value.toLocaleString('en-US')}</span>;
}

export const Welcome = (props: Props) => {
  const { teamCount } = props;
  const { onWelcomeSignInClicked } = useHomeAnalytics();

  return (
    <section className={s.welcome}>
      <div className={s.text}>
        <p className={s.title}>
          Updates from{' '}
          {teamCount ? (
            <>
              <Count value={teamCount} />{' '}
            </>
          ) : null}
          {teamCount === 1 ? 'team' : 'teams'}, ordered around your work
        </p>
        <p className={s.sub}>
          Sign in and the updates matching your skills, your team&apos;s work, and the teams you follow show first.
        </p>
      </div>

      <div className={s.ctas}>
        <LoginBtn className={s.cta} onClick={onWelcomeSignInClicked}>
          Sign in
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </LoginBtn>
      </div>
    </section>
  );
};
