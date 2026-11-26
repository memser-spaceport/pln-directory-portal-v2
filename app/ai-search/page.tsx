import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { AiSearchPageBody } from '@/components/page/husky/AiSearchPageBody/AiSearchPageBody';

export default async function HuskyPage() {
  const { isLoggedIn } = await getCookiesFromHeaders();

  return (
    <div className={styles.husky}>
      <div className={styles.husky__container}>
        <AiSearchPageBody isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
