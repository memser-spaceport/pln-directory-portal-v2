import styles from './page.module.css';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import Error from '@/components/core/error';
import { Metadata } from 'next';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import IrlHeader from '@/components/page/irl/irl-header';
import IrlLocation from '@/components/page/irl/locations/irl-location';
import IrlEvents from '@/components/page/irl/events/irl-events';
import { getAllLocations, getEventsByLocation } from '@/services/irl.service';

export default async function Page({ searchParams }: { searchParams: any }) {
  const { isError, userInfo, isLoggedIn, locationDetails, eventDetails } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles.irlGatherings}>
      <div className={styles.irlGatherings__cn}>
        <section className={styles.irlGatherings__header}>
          <IrlHeader />
        </section>
        <section className={styles.irlGatheings__locations}>
          <IrlLocation locationDetails={locationDetails} searchParams={searchParams}/>
        </section>
        <section className={styles.irlGatherings__events}>
          <IrlEvents isLoggedIn={isLoggedIn} eventDetails={eventDetails} searchParams={searchParams}/>
        </section>
        {/* Guests */}
        <section className={styles.irlGatheings__guests}></section>
      </div>
    </div>
  );
}



const getPageData = async (searchParams: any) => {
  const { authToken, userInfo, isLoggedIn } = getCookiesFromHeaders();

  let showTelegram = true;
  let isError: boolean = false;
  let eventDetails;
  let locationDetails;
  let isUserGoing: boolean = false;

  try {
    const locationsResponse = await getAllLocations();
    if (locationsResponse.isError) {
      isError = true;
    }
    
    locationDetails = locationsResponse;

    if(searchParams?.location) {
      const locationName = searchParams.location;
      const locationData = locationsResponse?.find((loc: any) => loc.location.split(",")[0].trim() === locationName);
      isError = locationData === undefined;
      if(locationData) {
        eventDetails = locationData;
      }
    } else {
      eventDetails = locationsResponse[0];
    } 

    //TODO
    // const { location, type } = getSearchParams(searchParams, locationsResponse);
    // const events = await getEventsByLocation(location || locationsResponse[1].uid, type, authToken);
    // if (events.isError) {
    //   isError = true;
    // }

    // eventDetails = events;

  } catch {
    return { isError: true };
  }

  return { isError, userInfo, isLoggedIn, isUserGoing, showTelegram, eventDetails, locationDetails };
};

function getSearchParams(searchParams: any, locationsResponse: any) {
  let location = '';
  if (searchParams?.location) {
    const locationName = searchParams.location;
    const locationData = locationsResponse?.find((loc: any) => loc.location === locationName);

    if (locationData) {
      location = locationData.uid;
    }
  }

  const type = searchParams?.type || 'upcoming';

  return { location, type };
}

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
