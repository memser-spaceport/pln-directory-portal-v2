'use client';

import { LoginBtn } from '@/components/core/navbar/components/LoginBtn';
import { useHomeAnalytics } from '@/analytics/home.analytics';

import s from './Welcome.module.scss';

interface Props {
  teamCount?: number;
  memberCount?: number;
}

function Count({ value }: { value: number }) {
  return <span className={s.titleHighlight}>{value.toLocaleString('en-US')}</span>;
}

export const Welcome = (props: Props) => {
  const { teamCount, memberCount } = props;
  const { onWelcomeSignInClicked } = useHomeAnalytics();

  return (
    <section className={s.welcome}>
      <div className={s.text}>
        <p className={s.title}>
          See personalized updates from{' '}
          {teamCount ? (
            <>
              <Count value={teamCount} />{' '}
            </>
          ) : null}
          PL network {teamCount === 1 ? 'team' : 'teams'}
          {memberCount ? (
            <>
              {' '}
              and <Count value={memberCount} /> {memberCount === 1 ? 'member' : 'members'}
            </>
          ) : null}
        </p>
        <p className={s.sub}>The feed is curated based on your skills and team plus the teams you follow.</p>
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
