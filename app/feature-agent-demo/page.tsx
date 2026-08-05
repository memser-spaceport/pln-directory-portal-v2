import { Metadata } from 'next';
import styles from './page.module.css';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';

export default function FeatureAgentDemo() {
  return (
    <section className={styles.featureAgentDemo}>
      <h1 className={styles.title}>Hello from autonomous coding agent</h1>
    </section>
  );
}

export const metadata: Metadata = {
  title: 'Feature Agent Demo | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
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
