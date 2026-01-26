import CurrentRoundComponent from '@/components/page/aligement-assets/rounds/current-round-component';
import styles from './plaa.module.css';

export default function PlaaPage() {
  return (
    <div className={styles.rounds}>
      <CurrentRoundComponent />
    </div>
  );
}
