import Error from '@/components/core/error';
import AttendeeList from '@/components/page/irl/attendee-list/attendees-list';
import IrlEvents from '@/components/page/irl/events/irl-events';
import IrlHeader from '@/components/page/irl/irl-header';
import IrlLocation from '@/components/page/irl/locations/irl-location';
import { getAllLocations, getGuestsByLocation } from '@/services/irl.service';
import { getMemberPreferences } from '@/services/preferences.service';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import styles from './page.module.css';
import { IAnalyticsGuestLocation } from '@/types/irl.types';
import IrlErrorPage from '@/components/core/irl-error-page';

export default async function Page({ searchParams }: any) {
  const { isError, userInfo, isLoggedIn, locationDetails, eventDetails, showTelegram, eventLocationSummary, guestDetails, isUserGoing, isLocationError} = await getPageData(searchParams);

  if (isLocationError) {
    return <IrlErrorPage />;
  }

  if (isError) {
    return <Error />;
  }
  
  return (
    <div className={styles.irlGatherings}>
      <div className={styles.irlGatherings__cn}>
        {/* Header */}
        <section className={styles.irlGatherings__header}>
          <IrlHeader />
        </section>
        {/* Locations */}
        <section className={styles.irlGatheings__locations}>
          <IrlLocation locationDetails={locationDetails} searchParams={searchParams} />
        </section>
        {/* Events */}
        <section className={styles.irlGatherings__events}>
          <IrlEvents isLoggedIn={isLoggedIn} eventDetails={eventDetails} searchParams={searchParams} />
        </section>
        {/* Guests */}
        {guestDetails?.events?.length > 0 && (
          <section className={styles.irlGatheings__guests}>
            <AttendeeList
              location={eventLocationSummary as IAnalyticsGuestLocation}
              showTelegram={showTelegram as boolean}
              eventDetails={guestDetails}
              userInfo={userInfo}
              isLoggedIn={isLoggedIn}
              isUserGoing={isUserGoing as boolean}
              searchParams={searchParams}
            />
          </section>
        )}
      </div>
    </div>
  );
}

const getPageData = async (searchParams: any) => {
  const { authToken, userInfo, isLoggedIn } = getCookiesFromHeaders();
  let showTelegram = true;
  let isError = false;
  let isLocationError = false;
  let isUserGoing = false;
  let isEventActive = true;
  let isEventAvailable = true;

  try {
    // Fetch locations data
    const locationDetails = await getAllLocations();
    if (locationDetails.isError) {
      return { isError: true };
    }

    // Find event details based on search parameters or default to first location
    const eventDetails = searchParams?.location ? locationDetails.find((loc: any) => loc.location.split(',')[0].trim() === searchParams.location) : locationDetails[0];
    const { uid, location: name, pastEvents } = eventDetails;

    if(searchParams?.type) {
      isEventActive = ['upcoming', 'past'].includes(searchParams?.type);
    }

    if(searchParams?.event) {
      isEventAvailable = pastEvents.some((event: any) => event.slugURL === searchParams?.event);
    }

    if (!eventDetails || !isEventActive || !isEventAvailable) {
      return { isLocationError: true };
    }
    const eventLocationSummary = { uid, name };

    // Determine event type and fetch event guest data
    const eventType = searchParams?.type === 'past' ? '' : 'upcoming';

    if (searchParams?.type === 'past' && !searchParams?.event) {
      searchParams.event = pastEvents[0]?.slugURL;
    }

    const slugURL = searchParams?.event;

    const events = await getGuestsByLocation(uid, eventType, authToken, slugURL, userInfo);
    if (events.isError) {
      return { isError: true };
    }

    let guestDetails = events as any;
    isUserGoing = guestDetails.isUserGoing;
    guestDetails.events = eventType === 'upcoming' ? eventDetails.upcomingEvents : eventDetails.pastEvents;

    // Fetch member preferences if the user is logged in
    if (isLoggedIn) {
      const memberPreferencesResponse = await getMemberPreferences(userInfo.uid, authToken);
      if (memberPreferencesResponse.isError) {
        return { isError: true };
      }
      showTelegram = memberPreferencesResponse.memberPreferences?.telegram ?? true;
    }

    return {
      isError,
      isLocationError,
      userInfo,
      isLoggedIn,
      isUserGoing,
      showTelegram,
      eventDetails,
      guestDetails,
      eventLocationSummary,
      locationDetails,
    };
  } catch (e) {
    console.error('Error fetching IRL data', e);
    return { isError: true };
  }
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
