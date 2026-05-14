import LoginBtn from '@/components/core/navbar/login-btn';
import styles from './Welcome.module.scss';

export const Welcome = () => {
  return (
    <section className={styles.welcome}>
      <div className={styles.text}>
        <div className={styles.eyebrow}>Welcome to</div>
        <h1 className={styles.title}>LabOS</h1>
        <p className={styles.sub}>
          The collaboration platform for the Protocol Labs network. Connect with 3,000+ members driving breakthroughs in
          computing to push humanity forward.
        </p>
      </div>
      <div className={styles.actions}>
        <div className={styles.pitch}>Connect, book office hours, and join IRL Gatherings.</div>
        <LoginBtn className={styles.cta}>
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
