import { getCookiesFromHeaders } from '@/utils/next-helpers';
import KudosBoardComponent from '@/components/page/aligement-assets/kudos-board/kudos-board-component';
import { KudosGuestCta } from '@/components/page/aligement-assets/kudos-board/kudos-guest-cta';
import styles from './page.module.css';

export default async function KudosBoardPage() {
  const { isLoggedIn } = await getCookiesFromHeaders();

  // Guests still don't get the board — it stays unmounted, so no feed request
  // is made. They get the sign-in path instead of being bounced to
  // /alignment-asset, matching how the profile page handles the same case.
  if (!isLoggedIn) {
    return (
      <div className={styles.kudosBoard}>
        <KudosGuestCta />
      </div>
    );
  }

  return (
    <div className={styles.kudosBoard}>
      <KudosBoardComponent />
    </div>
  );
}
