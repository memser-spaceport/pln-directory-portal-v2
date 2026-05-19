import LoginBtn from '@/components/core/navbar/login-btn';
import s from './Welcome.module.scss';

export const Welcome = () => {
  return (
    <section className={s.welcome}>
      <div className={s.text}>
        <p className={s.title}>
          Welcome to <span className={s.titleHighlight}>LabOS</span>
        </p>
        <p className={s.sub}>
          The collaboration platform for the Protocol Labs network. Connect with 3,000+ members driving breakthroughs in
          computing to push humanity forward.
        </p>
      </div>
      <LoginBtn className={s.cta}>
        Sign In
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
    </section>
  );
};
