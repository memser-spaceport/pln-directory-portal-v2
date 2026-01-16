import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound7Data } from '@/components/page/aligement-assets/rounds/data/round-7.data';
import styles from './page.module.css';

export default function PastRound7Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound7Data} />
    </div>
  );
}
