import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
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

export const metadata: Metadata = {
  title: 'Husky | Protocol Labs Directory',
  description: 'Husky interaction page for Protocol Labs Directory',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
