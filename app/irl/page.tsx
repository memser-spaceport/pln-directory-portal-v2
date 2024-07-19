import styles from './page.module.css';
import IrlBanner from '@/components/page/irl-list/irl-banner';
import IrlList from '@/components/page/irl-list/irl-list';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getAllEvents, getUserEvents } from '@/services/irl.service';
import Error from '@/components/core/error';
import { Metadata } from 'next';

export default async function Page() {
  const { error, conference, userEvents, userInfo } = await getPageData();

  if (error) {
    return <Error />;
  }

  return (
    <section className={styles.irlWrpr}>
      <div className={styles.irl}>
        <div className={styles.irl__banner}>
          <IrlBanner />
        </div>
        <div className={styles.irl__conferences}>
          <IrlList conference={conference} userEvents={userEvents} userInfo={userInfo} />
        </div>
      </div>
    </section>
  );
}

const getPageData = async () => {
  let conference = [] as any;
  let userEvents = null;
  let error = false;

  const { isLoggedIn, authToken, userInfo } = getCookiesFromHeaders();

  const events = await getAllEvents();

  if (events.errorCode) {
    error = true;
  } else {
    conference = events;
  }

  if (isLoggedIn) {
    userEvents = await getUserEvents(authToken);
    if (!userEvents?.errorCode) {
      userEvents = userEvents.map((event: any) => event.uid);
    }
  }

  return { conference, userEvents, isLoggedIn, userInfo, error };
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
