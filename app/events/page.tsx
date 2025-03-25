import React from 'react'
import { Metadata } from 'next'
import styles from './page.module.css'
import EventsBanner from '@/components/page/events/events-banner'
import EventsSection from '@/components/page/events/events-section'
import ContributorsSection from '@/components/page/events/contributors/contributors-section'
import HuskyBanner from '@/components/page/events/husky-banner'
import { ADMIN_ROLE } from '@/utils/constants'
import { getCookiesFromHeaders } from '@/utils/next-helpers'
import { getAggregatedEventsData, getEventContributors } from '@/services/events.service'
import Error from '@/components/core/error';
import ScheduleSection from '@/components/page/events/schedule-section'
import { formatFeaturedData } from '@/utils/home.utils'

export const metadata: Metadata = {
  title: 'Events | Protocol Labs Directory',
  description: 'Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.',
}

export default async function EventsPage() {
  const { aggregatedEventsData, isLoggedIn, userInfo, contributorsData, isError } = await getPageData();

  if (isError) {
    return <Error />;
  }

  return (
    <>
      <div className={styles.eventsPage}>
        <EventsBanner userInfo={userInfo} />
      </div>
      
      <EventsSection eventLocations={aggregatedEventsData} isLoggedIn={isLoggedIn} userInfo={userInfo}/>
      
      <div className={styles.huskyBannerContainer}>
        <HuskyBanner userInfo={userInfo} />
      </div>

      <div className={styles.contributorsSection}> 
        <ContributorsSection
          members={contributorsData?.members}
          teams={contributorsData?.teams}
          title="Contributors"
          treemapConfig={{
            backgroundColor: "#81E7FF", 
            borderColor: "#00000033",
            height: 400,
          }}
          userInfo={userInfo}
        />
      </div>
      <div className={styles.container}>
        <ScheduleSection userInfo={userInfo}/>
      </div>

    </>
  )
} 

const getPageData = async () => {
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  let isError = false;
  let aggregatedEventsData = [];

  let [aggregatedEventsresponse, contributorsData] = await Promise.all([
    getAggregatedEventsData(authToken, isLoggedIn, isAdmin),
    getEventContributors(),
  ]);

  if (aggregatedEventsresponse?.error || contributorsData?.error) {
    isError = true;
  }

  aggregatedEventsData = formatFeaturedData(aggregatedEventsresponse?.data);
  return {
    userInfo,
    isLoggedIn,
    aggregatedEventsData,
    contributorsData,
    isError,
  }
};