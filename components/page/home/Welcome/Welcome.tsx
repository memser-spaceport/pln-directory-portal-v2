import { LoginBtn } from '@/components/core/navbar/components/LoginBtn';

import s from './Welcome.module.scss';

interface Props {
  teamCount?: number;
  memberCount?: number;
}

function networkInventory(teamCount?: number, memberCount?: number) {
  const teams = `${teamCount ? `${teamCount.toLocaleString('en-US')} ` : ''}PL network ${teamCount === 1 ? 'team' : 'teams'}`;
  if (!memberCount) return teams;
  return `${teams} and ${memberCount.toLocaleString('en-US')} ${memberCount === 1 ? 'member' : 'members'}`;
}

export const Welcome = (props: Props) => {
  const { teamCount, memberCount } = props;

  return (
    <section className={s.welcome}>
      <div className={s.text}>
        <p className={s.title}>
          See personalized updates from{' '}
          <span className={s.titleHighlight}>{networkInventory(teamCount, memberCount)}</span>
        </p>
        <p className={s.sub}>The feed reorders around your skills, your focus areas, and the teams you follow.</p>
      </div>

      <div className={s.ctas}>
        <LoginBtn className={s.cta}>
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
