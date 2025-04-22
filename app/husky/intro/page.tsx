import IntroContainer from '@/components/page/husky/intro-container';
import IntroSidebarContainer from '@/components/page/husky/intro/intro-sidebar-container';
import { SidebarProvider } from '@/components/page/husky/sidebar';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { PAGE_ROUTES } from '@/utils/constants';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
export default async function HuskyPage() {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || '';
  const isIntroRoute = pathname === PAGE_ROUTES.INROS_AI;  

  if (isIntroRoute && !isLoggedIn) {
    redirect(PAGE_ROUTES.HUSKY);
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <IntroSidebarContainer isLoggedIn={isLoggedIn} />
      <div className={styles.husky}>
        <div className={styles.husky__container}>
          <IntroContainer isLoggedIn={isLoggedIn} userInfo={userInfo} />
        </div>
      </div>
    </SidebarProvider>
  );
}