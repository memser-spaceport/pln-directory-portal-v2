import Breadcrumbs from '@/components/ui/breadcrumbs';
import styles from './page.module.css';
import SettingsMenu from '@/components/page/settings/menu';
import ManageMembersSettings from '@/components/page/settings/manage-members';
import Link from 'next/link';
import { getMemberInfo, getMembersInfoForDp } from '@/services/members.service';
import { redirect } from 'next/navigation';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getMemberPreferences } from '@/services/preferences.service';
import { Metadata } from 'next';
import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';

const getPageData = async (selectedMemberId: string, authToken: string, isVerifiedFlag: string) => {
  const dpResult = await getMembersInfoForDp(isVerifiedFlag);
  let selectedVerifiedFlag = isVerifiedFlag;
  let selectedMember; 
  let preferences: any = {};
  if (dpResult.error) {
    return { isError: true };
  }

  const members = dpResult?.data ?? [];
  const [memberResult, preferenceResult] = await Promise.all([getMemberInfo(selectedMemberId ?? members[0].id), getMemberPreferences(selectedMemberId ?? members[0].id, authToken)]);
  if (memberResult.isError || preferenceResult.isError) {
    return {
      isError: true,
    };
  }
  if(selectedMemberId) {
    selectedVerifiedFlag = memberResult?.data?.isVerified?.toString() ?? 'true';
  }

  selectedMember = memberResult.data;
  preferences.memberPreferences = preferenceResult.memberPreferences
  preferences.preferenceSettings = preferenceResult.preferenceSettings
  return {
    members,
    selectedMember,
    preferences,
    selectedVerifiedFlag
  };
};

export default async function ManageMembers(props: any) {
  const isVerified = props?.searchParams?.isVerified ?? 'true';
  const selectedMemberId = props?.searchParams?.id;
  const viewType = props?.searchParams?.viewType ?? 'profile';
  const { userInfo, isLoggedIn, authToken } = getCookiesFromHeaders();

  if (!isLoggedIn) {
    redirect(PAGE_ROUTES.HOME);
  }
  const roles = userInfo.roles ?? [];
  const leadingTeams = userInfo.leadingTeams ?? [];
  const isTeamLead = leadingTeams.length > 0;
  const isAdmin = roles.includes('DIRECTORYADMIN');

  if (!isAdmin) {
    redirect(PAGE_ROUTES.HOME);
  }
  const { members, isError, selectedMember, preferences, selectedVerifiedFlag } = await getPageData(selectedMemberId, authToken, isVerified);
  if( preferences.memberPreferences) {
    preferences.memberPreferences.newsLetter = selectedMember?.isSubscribedToNewsletter;
  }
  const formattedMembers = [...members]?.filter(v => v.id !== userInfo.uid)
  if (isError) {
    return 'Error';
  }

  const breadcrumbItems = [
    { url: '/', icon: '/icons/home.svg' },
    { text: 'People', url: '/members' },
    { text: `${userInfo.name}`, url: `/members/${userInfo.uid}` },
    { text: 'Manage People', url: '/settings/members' },
  ];
  return (
    <>
      <div className={styles.ps}>
        <div className={styles.ps__breadcrumbs}>
          <div className={styles.ps__breadcrumbs__desktop}>
            <Breadcrumbs items={breadcrumbItems} LinkComponent={Link} />
          </div>
        </div>
        <div className={styles.ps__backbtn}>
            <SettingsBackButton title="Manage People" />
        </div>
        <div className={styles.ps__main}>
          <aside className={styles.ps__main__aside}>
            <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} activeItem="manage members" userInfo={userInfo}/>
          </aside>
          <div className={styles.ps__main__content}>
            <ManageMembersSettings preferences={preferences} viewType={viewType} selectedMember={selectedMember} members={formattedMembers ?? []} userInfo={userInfo} isVerifiedFlag={selectedVerifiedFlag ?? 'true'}/>
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