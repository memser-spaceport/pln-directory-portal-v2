import { Metadata } from 'next';
import styles from './page.module.css';

export default function FeatureAgentDemo() {
  return (
    <section className={styles.container}>
      <p className={styles.message}>Hello from autonomous coding agent</p>
    </section>
  );
}

export const metadata: Metadata = {
  title: 'Feature Agent Demo | Protocol Labs Directory',
  description: 'Feature agent demo page.',
};
