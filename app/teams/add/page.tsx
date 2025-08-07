import { BreadCrumb } from '@/components/core/bread-crumb';
import Error from '@/components/core/error';
import AddEditProjectContainer from '@/components/page/add-edit-project/add-edit-project-container';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { RedirectType, redirect } from 'next/navigation';
import { PAGE_ROUTES, PROJECT_NAME, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { Metadata } from 'next';
import { METADATA_DESC, METADATA_TITLE, SUBMIT_A_TEAM_PAGE_TITLE } from '@/utils/constants/team-constants';
import AddEditTeamContainer from '@/components/page/add-edit-team/add-edit-team-container';
import LoginInfo from '@/components/page/team-form-info/team-login-info';
import { BackButton } from '@/components/ui/BackButton';
import React from 'react';

export default function SubmitATeam(props: any) {
  const { isError, isLoggedIn, userInfo } = getPageData();

  // if(!isLoggedIn) {
  //     redirect(`${PAGE_ROUTES.HOME}`, RedirectType.replace);
  // }

  if (isError) {
    <Error />;
  }

  return (
    <div className={styles?.submitATeam}>
      <BackButton to={`/teams`} className={styles.backBtn} />
      {isLoggedIn && (
        <div className={styles.submitATeam__cnt}>
          <AddEditTeamContainer team={null} type="Add" userInfo={userInfo} />
        </div>
      )}
      {!isLoggedIn && (
        <div className={styles.loginPrompt}>
          <LoginInfo />
        </div>
      )}
    </div>
  );
}

function getPageData() {
  const isError = false;
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  try {
    return {
      isLoggedIn,
      userInfo,
    };
  } catch (error) {
    console.error(error);
    return {
      isError: true,
      userInfo,
    };
  }
}

export const metadata: Metadata = {
  title: METADATA_TITLE,
  description: METADATA_DESC,
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: PROJECT_NAME,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
