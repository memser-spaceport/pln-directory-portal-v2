import React from 'react'
import { Metadata } from 'next'
import styles from './page.module.css'
import EventsBanner from '@/components/page/events/events-banner'
import EventsSection from '@/components/page/events/events-section'
import { EVENT_LOCATIONS } from '@/utils/constants'
import ContributorsSection from '@/components/page/events/contributors/contributors-section'
import { mockMembers, mockTeams } from '@/utils/constants/events-constants'
import HuskyBanner from '@/components/page/events/husky/husky-banner'

export const metadata: Metadata = {
  title: 'Events | Protocol Labs Directory',
  description: 'Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.',
}

export default function EventsPage() {
  return (
    <>
      <div className={styles.eventsPage}>
        <EventsBanner />
      </div>
      
      <EventsSection eventLocations={EVENT_LOCATIONS} />
      
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
            backgroundColor: "#E5F7FF", // Light blue background
            borderColor: "#0F172A",
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