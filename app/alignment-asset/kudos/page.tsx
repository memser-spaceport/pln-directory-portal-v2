import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import KudosBoardComponent from '@/components/page/aligement-assets/kudos-board/kudos-board-component';
import styles from './page.module.css';

export default async function KudosBoardPage() {
  const { isLoggedIn } = await getCookiesFromHeaders();

  // Guests don't get the feature at all, not just a hidden nav entry: block
  // direct navigation too, and send them to the PLAA area they can still see.
  if (!isLoggedIn) {
    redirect('/alignment-asset');
  }

  return (
    <div className={styles.kudosBoard}>
      <KudosBoardComponent />
    </div>
  );
}
