import React from 'react'
import ContributorsSection from '@/components/page/events/contributors/contributors-section'
import { getCookiesFromHeaders } from '@/utils/next-helpers'
import { getEventContributors, getGuestDetail } from '@/services/events.service'
import Error from '@/components/core/error';

export default async function EventsPage() {
  const { userInfo, contributorsData, isError, membersDetail } = await getPageData();

  if (isError) {
    return <Error />;
  }

  return (
    <ContributorsSection
      members={membersDetail}
      teams={contributorsData?.teams}
      treemapConfig={{
        backgroundColor: "#81E7FF",
        borderColor: "#00000033",
        height: 400,
      }}
      userInfo={userInfo}
    />
  )
} 

const getPageData = async () => {
  const { userInfo } = getCookiesFromHeaders();
  let isError = false;

  let [contributorsData, membersDetail] = await Promise.all([
    getEventContributors(),
    getGuestDetail()
  ]);

  if (contributorsData?.error || membersDetail?.error) {
    isError = true;
  }

  return {
    userInfo,
    contributorsData,
    membersDetail: membersDetail?.data,
    isError,
  }
};