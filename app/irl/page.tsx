import styles from './page.module.css';
import IrlBanner from '@/components/page/irl-list/irl-banner';
import IrlList from '@/components/page/irl-list/irl-list';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getAllEvents, getUserEvents } from '@/services/irl.service';
import Error from '@/components/core/error';

export default async function Page() {
  const { error, conference, userEvents, userInfo, isLoggedIn } = await getPageData();

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
  let conference = { pastEvents: [], upComingEvents: [] } as any;
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
