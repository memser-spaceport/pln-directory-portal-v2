import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import styles from './rounds/page.module.css';

export default function PlaaPage() {
  return (
    <div className={styles.rounds}>
      <CurrentRoundComponent />
    </div>
  );
}
