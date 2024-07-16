import ChangelogList from '@/components/page/changelog/changelog-list';
import styles from './page.module.css'
import { Metadata } from 'next';

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
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: `https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`],
  },
};