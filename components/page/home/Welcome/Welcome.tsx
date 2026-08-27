import { LoginBtn } from '@/components/core/navbar/components/LoginBtn';

import { SignUpBtn } from './components/SignUpBtn';

import s from './Welcome.module.scss';

interface Props {
  teamCount?: number;
}

export const Welcome = (props: Props) => {
  const { teamCount } = props;

  return (
    <section className={s.welcome}>
      <div className={s.text}>
        <p className={s.title}>
          Personalize your updates from{' '}
          <span className={s.titleHighlight}>
            {teamCount ? `${teamCount.toLocaleString('en-US')} ` : ''}
            PL network {teamCount === 1 ? 'team' : 'teams'}
          </span>
        </p>
        <p className={s.sub}>The feed reorders around your skills, your focus areas, and the teams you follow.</p>
      </div>

      <div className={s.ctas}>
        <SignUpBtn>Create account</SignUpBtn>
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
