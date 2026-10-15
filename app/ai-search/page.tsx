import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { ChatContainer } from '@/components/page/husky/ChatContainer';

export default async function HuskyPage() {
  const { isLoggedIn } = await getCookiesFromHeaders();

  return (
    <div className={styles.husky}>
      <div className={styles.husky__container}>
        <ChatContainer isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
