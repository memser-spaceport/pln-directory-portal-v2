import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import styles from './page.module.css';

export default function RoundsPage() {
  return (
    <div className={styles.rounds}>
      <CurrentRoundComponent />
    </div>
  );
}
