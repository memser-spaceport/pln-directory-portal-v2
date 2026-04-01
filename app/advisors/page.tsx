import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { redirect } from 'next/navigation';
import { ADVISOR_WHITELISTED_FOUNDERS } from '@/config/advisors';
import { AdvisorsList } from '@/components/page/advisors/AdvisorsList';
import { PAGE_ROUTES } from '@/utils/constants';
import styles from './page.module.scss';

export default async function AdvisorsPage() {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();

  if (!isLoggedIn || !userInfo || !ADVISOR_WHITELISTED_FOUNDERS.includes(userInfo.uid)) {
    redirect(PAGE_ROUTES.HOME);
  }

  return (
    <div className={styles.page}>
      <AdvisorsList />
    </div>
  );
}

export const metadata = {
  title: 'Advisors | Protocol Labs Directory',
};
