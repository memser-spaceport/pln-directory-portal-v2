import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { redirect } from 'next/navigation';
import { AdvisorsList } from '@/components/page/advisors/AdvisorsList';
import { PAGE_ROUTES } from '@/utils/constants';
import styles from './page.module.scss';

export default async function AdvisorsContent() {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  // TODO: restrict to whitelist before production
  if (!isLoggedIn || !userInfo) {
    redirect(PAGE_ROUTES.HOME);
  }

  return (
    <div className={styles.content}>
      <div className={styles.toolbar}>
        <AdvisorsList />
      </div>
    </div>
  );
}
