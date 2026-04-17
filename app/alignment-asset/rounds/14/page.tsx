import PastRoundComponent from '@/components/page/aligement-assets/rounds/past-round-component';
import { pastRound14Data } from '@/components/page/aligement-assets/rounds/data/round-14.data';
import styles from './page.module.css';

export default function PastRound14Page() {
  return (
    <div className={styles.pastRound}>
      <PastRoundComponent pastRoundData={pastRound14Data} />
    </div>
  );
}
