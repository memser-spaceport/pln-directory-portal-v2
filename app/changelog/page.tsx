import ChangelogList from '@/components/page/changelog/changelog-list';
import styles from './page.module.css'
import { Metadata } from 'next';
import { PROJECT_DESC, SOCIAL_IMAGE_URL } from '@/utils/constants';

export default function Changelog() {
  return (
    <section className={styles.changelog}>
      <div className={styles.changelogList}>
        <ChangelogList />
      </div>
    </section>
  );
}

export const metadata: Metadata = {
  title: 'Changelog | Protocol Labs Directory',
  description: PROJECT_DESC,
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