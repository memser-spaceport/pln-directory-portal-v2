import { PAGE_ROUTES, SOCIAL_IMAGE_URL } from '@/utils/constants';
import { Metadata } from 'next';
import { getSkillsData } from '@/services/sign-up.service';
import Script from 'next/script';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { redirect, RedirectType } from 'next/navigation';
import { SignupWizard } from '@/components/page/sign-up/components/SignupWizard';

const getPageData = async () => {
  const memberInfo = await getSkillsData();
  const { isLoggedIn, userInfo } = getCookiesFromHeaders();
  let canAccess = false;
  let isLoggedInAndHaveAccess = false;
  if (userInfo) {
    const roles = userInfo.roles ?? [];
    const isAdmin = roles.includes('DIRECTORYADMIN');
    const isTeamLead = (userInfo.leadingTeams ?? []).length > 0;
    isLoggedInAndHaveAccess = isAdmin || isTeamLead;
  }
  canAccess = isLoggedInAndHaveAccess || !isLoggedIn;

  if (memberInfo.isError) {
    return {
      isError: true,
    };
  }

  return {
    skillsInfo: memberInfo.skills,
    canAccess,
  };
};

export default async function Page() {
  const { skillsInfo, canAccess } = await getPageData();

  if (!canAccess) {
    redirect(`${PAGE_ROUTES.HOME}`, RedirectType.replace);
  }

  return (
    <>
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.GOOGLE_SITE_KEY}`} strategy="lazyOnload"></Script>
      <SignupWizard />
    </>
  );
}

export const metadata: Metadata = {
  title: 'Sign up | Protocol Labs Directory',
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
