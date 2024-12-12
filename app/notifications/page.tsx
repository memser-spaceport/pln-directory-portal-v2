import { BreadCrumb } from '@/components/core/bread-crumb';
import Error from '@/components/core/error';
import AllNotifications from '@/components/page/notifications/all-notifications';
import { getFollowUps } from '@/services/office-hours.service';
import { PAGE_ROUTES } from '@/utils/constants';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import styles from './page.module.css';

async function Notifications({ searchParams }: { searchParams: any }) {
  const { isError, userInfo, notifications, isLoggedIn, authToken} = await getPageData();

  if(!isLoggedIn) {
    redirect(PAGE_ROUTES.HOME);
  }
  
  if (isError) {
    return <Error />;
  }

  return (
    <div className={styles?.notifications}>
      {/* <div className={styles?.notifications__breadcrumb}>
        <BreadCrumb backLink="/teams" directoryName="Notifications" pageName={userInfo.name ?? ''} />
      </div> */}

      <div className={styles?.notifications__body}>
        <AllNotifications authToken={authToken} userInfo={userInfo} notifications={notifications} />
      </div>
    </div>
  );
}

async function getPageData() {
  const { isLoggedIn, authToken, userInfo } = getCookiesFromHeaders();
  let notifications = [];
  let isError = false;

  try {
    const response = await getFollowUps(userInfo.uid ?? '', authToken, "PENDING,CLOSED");
    const result = response?.data ?? [];
    if (result?.error) {
      return {
        isError: true,
      };
    }
    if (result?.length) {
      notifications = result;
    }

    return {
      notifications,
      isLoggedIn,
      authToken,
      userInfo,
      isError,
    };
  } catch (error) {
    console.error(error);
    return {
      isError: true,
    };
  }
}

export default Notifications;

export const metadata: Metadata = {
  title: 'Notifications | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network people orient themselves within the network by making it easy to learn about other teams and people, including their roles, capabilities, and experiences.',
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
