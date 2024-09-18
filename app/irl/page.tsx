import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import Error from '@/components/core/error';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';

export default async function Page() {
  const { error, userInfo } = await getPageData();

  if (error) {
    return <Error />;
  }

  return (
    <div className={styles.irlGatherings}>
      <div className={styles.irlGatherings__cn}>
        {/* Header */}
        <section className={styles.irlGatherings__header}></section>
        {/* Locations */}
        <section className={styles.irlGatheings__locations}></section>
        {/* Agenda */}
        <section className={styles.irlGatherings__agenda}></section>
        {/* Guests */}
        <section className={styles.irlGatheings__guests}></section>
      </div>
    </div>
  );
}

const getPageData = async () => {
  let error = false;

  const { isLoggedIn, authToken, userInfo } = getCookiesFromHeaders();

  return { isLoggedIn, userInfo, error };
};

export const metadata: Metadata = {
  title: 'IRL Gatherings | Protocol Labs Directory',
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
