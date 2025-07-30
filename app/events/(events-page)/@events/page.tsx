import React from 'react';
import EventsSection from '@/components/page/events/events-section';
import RearrangeOrderPopup from '@/components/ui/rearrange-order-popup';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getAggregatedEventsData } from '@/services/events.service';
import Error from '@/components/core/error';
import { formatFeaturedData } from '@/utils/home.utils';

export default async function Events() {
  const { aggregatedEventsData, userInfo, isError } = await getPageData();

  if (isError) {
    return <Error />;
  }

  return (
    <>
      <EventsSection eventLocations={aggregatedEventsData} userInfo={userInfo} />
      <RearrangeOrderPopup />
    </>
  );
}

const getPageData = async () => {
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();
  let isError = false;

  let aggregatedEventsResponse = await getAggregatedEventsData(authToken);

  if (aggregatedEventsResponse?.error) {
    isError = true;
  }

  const aggregatedEventsData = formatFeaturedData(aggregatedEventsResponse?.data);

  return {
    userInfo,
    isLoggedIn,
    aggregatedEventsData,
    isError,
  };
};
