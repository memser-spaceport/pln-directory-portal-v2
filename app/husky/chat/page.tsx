import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import ChatContainer from '@/components/page/husky/chat-container';
import { SidebarProvider } from '@/components/page/husky/sidebar';
import AppSidebar from '@/components/page/husky/app-sidebar';
export default async function HuskyPage() {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();


  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar isLoggedIn={isLoggedIn} />
      <div className={styles.husky}>
        <div className={styles.husky__container}>
          <ChatContainer isLoggedIn={isLoggedIn} userInfo={userInfo} />
        </div>
      </div>
    </SidebarProvider>
  );
}