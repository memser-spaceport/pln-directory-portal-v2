import KudosBoardComponent from '@/components/page/aligement-assets/kudos-board/kudos-board-component';
import styles from './page.module.css';

export default function KudosBoardPage() {
  return (
    <div className={styles.kudosBoard}>
      <KudosBoardComponent />
    </div>
  );
}
