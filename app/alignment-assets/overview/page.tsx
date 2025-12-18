import styles from '../plaa.module.css';

export default function OverviewPage() {
  return (
    <>
      <h1 className={styles.plaa__title}>PL Alignment Asset</h1>
      <p className={styles.plaa__subtitle}>
        That&apos;s the idea behind the PL Alignment Asset:
      </p>

      <div className={styles.plaa__cards}>
        <div className={styles.plaa__card}>
          <p className={styles.plaa__description}>
            A shared rewards system that ties network-wide contributions to shared progress.
          </p>
        </div>
        <div className={styles.plaa__card}>
          <p className={styles.plaa__description}>
            An ongoing, iterative experiment to align value, collaboration, and recognition across the entire Protocol Labs ecosystem.
          </p>
        </div>
        <div className={styles.plaa__card}>
          <p className={styles.plaa__description}>
            Evolves with every version, adding new activities, mechanics, and ways to measure impact that move us closer to true collective success.
          </p>
        </div>
      </div>

      <div className={styles.plaa__actions}>
        <button className={styles.plaa__btn}>
          Create Your Account
        </button>
      </div>

      <div className={styles.plaa__section}>
        <h2 className={styles['plaa__section-title']}>Benefits</h2>
        <div className={styles.plaa__benefits}>
          <div className={styles.plaa__benefit}>
            <h3 className={styles['plaa__benefit-title']}>Get Recognized</h3>
            <p className={styles['plaa__benefit-text']}>
              Get recognized for the work you&apos;re already doing. Your contributions become visible and valued across the ecosystem.
            </p>
          </div>
          <div className={styles.plaa__benefit}>
            <h3 className={styles['plaa__benefit-title']}>Collect Points</h3>
            <p className={styles['plaa__benefit-text']}>
              Collect points that can convert to tokens for verified activities. Turn meaningful work into measurable outcomes.
            </p>
          </div>
          <div className={styles.plaa__benefit}>
            <h3 className={styles['plaa__benefit-title']}>Access Network</h3>
            <p className={styles['plaa__benefit-text']}>
              Access a wide network of collaborators and resources. Connect with contributors across the ecosystem.
            </p>
          </div>
          <div className={styles.plaa__benefit}>
            <h3 className={styles['plaa__benefit-title']}>Shape the Future</h3>
            <p className={styles['plaa__benefit-text']}>
              Help shape the future of network-wide incentives. Your participation influences how value is measured and rewarded.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
