import React from 'react'
import { Metadata } from 'next'
import styles from './page.module.css'
import EventsBanner from '@/components/page/events/events-banner'
import EventsSection from '@/components/page/events/events-section'
import ContributorsSection from '@/components/page/events/contributors/contributors-section'
import { mockMembers, mockTeams, mockEvents } from '@/utils/constants/events-constants'
import HuskyBanner from '@/components/page/events/husky-banner'
import { ADMIN_ROLE } from '@/utils/constants'
import { getCookiesFromHeaders } from '@/utils/next-helpers'

export const metadata: Metadata = {
  title: 'Events | Protocol Labs Directory',
  description: 'Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.',
}

export default async function EventsPage() {
  const { featuredData, isLoggedIn, userInfo } = await getPageData();
  return (
    <>
      <div className={styles.eventsPage}>
        <EventsBanner />
      </div>
      
      <EventsSection eventLocations={featuredData} isLoggedIn={isLoggedIn} userInfo={userInfo}/>
      
      <div className={styles.huskyBannerContainer}>
        <HuskyBanner />
      </div>

      <div className={styles.contributorsSection}> 
        <ContributorsSection
          members={mockMembers}
          teams={mockTeams}
          title="Contributors"
          subtitle="Speaker & Host Participation"
          treemapConfig={{
            backgroundColor: "#81E7FF", // Light blue background
            borderColor: "#00000033",
            textColor: "#0F172A",
            height: 400,
          }}
        />
      </div>
      {/*  calendar section */}
      <div className={styles.container}>

      </div>
    </>
  )
} 

const getPageData = async () => {
  const { isLoggedIn, userInfo, authToken } = getCookiesFromHeaders();
  const isAdmin = userInfo?.roles?.includes(ADMIN_ROLE);
  const featuredData = mockEvents;
  return {
    userInfo,
    isLoggedIn,
    featuredData,
}
};