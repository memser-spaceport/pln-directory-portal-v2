import Error from '@/components/core/error';
import AttendeeList from '@/components/page/irl/attendee-list/attendees-list';
import IrlEvents from '@/components/page/irl/events/irl-events';
import IrlHeader from '@/components/page/irl/irl-header';
import IrlLocation from '@/components/page/irl/locations/irl-location';
import { getAllLocations, getFollowersByLocation, getGuestEvents, getGuestsByLocation, getTopicsByLocation } from '@/services/irl.service';
import { getMemberPreferences } from '@/services/preferences.service';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import styles from './page.module.css';
import { IAnalyticsGuestLocation } from '@/types/irl.types';
import IrlErrorPage from '@/components/core/irl-error-page';
import { getFilteredEventsForUser, parseSearchParams } from '@/utils/irl.utils';
import IrlFollowGathering from '@/components/page/irl/follow-gathering/irl-follow-gathering';

export default async function Page({ searchParams }: any) {
  const {
    isError,
    userInfo,
    isLoggedIn,
    followers,
    locationDetails,
    eventDetails,
    showTelegram,
    eventLocationSummary,
    guestDetails,
    isUserGoing,
    isLocationError,
    currentEventNames,
    searchParams: newSearchParams,
  } = await getPageData(searchParams);
  if (isLocationError) {
    return <IrlErrorPage />;
  } else if (isError) {
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
          <IrlEvents
            isUserGoing={isUserGoing as boolean}
            userInfo={userInfo}
            isLoggedIn={isLoggedIn}
            eventDetails={eventDetails}
            searchParams={searchParams}
            guestDetails={guestDetails}
            locationDetails={locationDetails}
          />
        </section>
        {/* Follow Gathering */}
        <section className={styles.irlGatheings__follow}>
          <IrlFollowGathering
            eventLocationSummary={eventLocationSummary}
            followers={followers ?? []}
            userInfo={userInfo}
            isLoggedIn={isLoggedIn}
            searchParams={searchParams}
            eventDetails={eventDetails}
            guestDetails={guestDetails}
          />
        </section>
        {/* Guests */}
        <section className={styles.irlGatheings__guests}>
          <AttendeeList
            location={eventLocationSummary as IAnalyticsGuestLocation}
            showTelegram={showTelegram as boolean}
            eventDetails={guestDetails}
            userInfo={userInfo}
            isLoggedIn={isLoggedIn}
            isUserGoing={isUserGoing as boolean}
            searchParams={searchParams}
            currentEventNames={currentEventNames}
            locationEvents={eventDetails}
            followers={followers}
            newSearchParams={newSearchParams}
          />
        </section>
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
  let followers = [];

  try {
    // Fetch locations data
    const locationDetails = await getAllLocations();
    if (locationDetails?.isError) {
      return { isError: true };
    }

    if (searchParams?.location) {
      const locationObject = locationDetails.find((loc: any) => loc.location.split(',')[0].trim() === searchParams.location);
      if (!locationObject) {
        return { isLocationError: true };
      }
    }

    // Find event details based on search parameters or default to first location
    const eventDetails = searchParams?.location ? locationDetails.find((loc: any) => loc.location.split(',')[0].trim() === searchParams.location) : locationDetails[0];
    const { uid, location: name, pastEvents, flag } = eventDetails;

    //check correct event type
    if (searchParams?.type) {
      isEventActive = ['upcoming', 'past'].includes(searchParams?.type);
    }

    //check correct event slug
    if (searchParams?.event) {
      const eventResult = locationDetails.flatMap((item: { pastEvents: any[]; upcomingEvents: any[] }) => [
        ...item.pastEvents.map((event) => ({ ...event })),
        ...item.upcomingEvents.map((event) => ({ ...event })),
      ]);
      isEventAvailable = eventResult.some((event: any) => {
        return event.slugURL === searchParams?.event;
      });
    }

    if (!eventDetails || !isEventActive || !isEventAvailable) {
      return { isLocationError: true };
    }
    const eventLocationSummary = { uid, name, flag };

    // Determine event type and fetch event guest data
    const eventType = searchParams?.type === 'past' ? 'past' : searchParams?.type === 'upcoming' ? 'upcoming' : '';
    const currentEvents = eventType === 'upcoming' ? eventDetails?.upcomingEvents : eventType === 'past' ? eventDetails?.pastEvents : eventDetails?.events;
    const currentEventNames = currentEvents?.map((item: any) => item.name); // Get current event names

    // Set default event if location has only past events
    if (!eventType) {
      if (eventDetails?.upcomingEvents?.length === 0 && eventDetails?.pastEvents?.length > 0) {
        searchParams.event = pastEvents[0]?.slugURL;
        searchParams.type = 'past';
      }
    } else {
      if (eventType === 'past' && !searchParams?.event) {
        searchParams.event = pastEvents[0]?.slugURL;
      }
    }

    // Proceed with API calls only after currentEventNames is set
    const [events, currentGuestResponse, topics, loggedInUserEvents, followersResponse] = await Promise.all([
      getGuestsByLocation(uid, parseSearchParams(searchParams, currentEvents), authToken, currentEventNames),
      getGuestsByLocation(uid, { type: eventType }, authToken, currentEventNames, 1, 1),
      getTopicsByLocation(uid, eventType),
      getGuestEvents(uid, authToken),
      getFollowersByLocation(uid, authToken),
    ]);

    if (events?.isError) {
      return { isError: true };
    }
    if (followersResponse?.isError) {
      followers = [];
    }

    followers = followersResponse?.data ?? [];
    if (followers?.length > 0) {
      followers = followers?.sort((a: any, b: any) => {
        if (!a.logo && b.logo) return 1;
        if (a.logo && !b.logo) return -1;
        return a.name.localeCompare(b.name);
      });
    }
    let guestDetails = events as any;
    const selectedTypeEvents = eventType === 'past' || (eventDetails?.upcomingEvents?.length === 0 && eventDetails?.pastEvents?.length > 0) ? eventDetails.pastEvents : eventDetails.upcomingEvents;

    guestDetails.events = selectedTypeEvents;
    guestDetails.currentGuest = currentGuestResponse?.guests?.[0]?.memberUid === userInfo?.uid ? currentGuestResponse?.guests?.[0] : null;
    guestDetails.isUserGoing = selectedTypeEvents?.some((event: any) => loggedInUserEvents?.some((userEvent: any) => userEvent?.uid === event?.uid));
    guestDetails.topics = topics;
    guestDetails.eventsForFilter = getFilteredEventsForUser(loggedInUserEvents, currentEvents, isLoggedIn, userInfo);

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
      currentEventNames,
      followers,
      searchParams,
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
