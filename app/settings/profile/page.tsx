import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import MemberSettings from '@/components/page/settings/member-settings';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getMemberInfo } from '@/services/members.service';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { Metadata } from 'next';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';

const getPageData = async (userId: string) => {
  const memberInfo = await getMemberInfo(userId);
  if(memberInfo.isError) {
    return {
      isError: true
    }
  }

  return {
    memberInfo: memberInfo.data
  }
}

export default async function ProfileSettings() {
  const {isLoggedIn, userInfo} = getCookiesFromHeaders();

  if(!isLoggedIn) {
    redirect(PAGE_ROUTES.HOME);
  }

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const { memberInfo } = await getPageData(userInfo.uid)

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'People', url: '/members' },
    { text: `${memberInfo.name}`, url: `/members/${memberInfo.uid}` },
    { text: 'Profile', url: `/settings/profile` },
  ]

  return (
    <>
      <div className={styles.ps}>
        <div className={styles.ps__breadcrumbs}>
          <div className={styles.ps__breadcrumbs__desktop}>
            <Breadcrumbs items={breadcrumbItems} LinkComponent={Link} />
          </div>
        </div>
        <div className={styles.ps__backbtn}>
            <SettingsBackButton title="People Profile" />
        </div>
        <div className={styles.ps__main}>
          <aside className={styles.ps__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="profile" userInfo={userInfo}/>
          </aside>
          <div className={styles.ps__main__content}>
            <MemberSettings memberInfo={memberInfo} userInfo={userInfo}/>
          </div>
        </div>
      </div>
    </>
  );
}

export const metadata: Metadata = {
  title: 'Settings | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network people orient themselves within the network by making it easy to learn about other teams and people, including their roles, capabilities, and experiences.',
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