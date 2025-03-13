import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import ChatContainer from '@/components/page/husky/chat-container';

export default async function HuskyPage() {
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();

  return (
    <div className={styles.husky}>
      <div className={styles.husky__container}>
        <ChatContainer isLoggedIn={isLoggedIn} userInfo={userInfo} />
      </div>
    </div>
  );
}