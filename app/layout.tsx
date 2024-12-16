import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import Navbar from '../components/core/navbar/nav-bar';
import './globals.css';
import StyledJsxRegistry from '../providers/registry';
import { Suspense } from 'react';

import { getCookiesFromHeaders } from '@/utils/next-helpers';
import dynamic from 'next/dynamic';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import HuskySidePanel from '@/components/core/husky/husky-sidepanel';

// dynamic components:
const Loader = dynamic(() => import('../components/core/loader'), { ssr: false });
const AuthBox = dynamic(() => import('@/components/core/login/auth-box'), { ssr: false });
const Toaster = dynamic(() => import('../components/core/toaster'), { ssr: false });
const BroadCastChannel = dynamic(() => import('@/components/core/login/broadcast-channel'), { ssr: false });
const MemberRegisterDialog = dynamic(() => import('@/components/core/register/member-register-dialog'), { ssr: false });
// const TeamRegisterDialog = dynamic(() => import('@/components/page/team-form-info/team-register-dialog'), { ssr: false });
const CookieChecker = dynamic(() => import('@/components/core/login/cookie-checker'), { ssr: false });
const PostHogPageview = dynamic(() => import('@/providers/analytics-provider').then((d) => d.PostHogPageview), { ssr: false });
const RatingContainer = dynamic(() => import('@/components/core/office-hours-rating/rating-container'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Protocol Labs Directory',
  description: 'The Protocol Labs Directory drives breakthroughs in computing to push humanity forward.',
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
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { userInfo, isLoggedIn, authToken } = getCookiesFromHeaders();

  return (
    <html>
      <head>
        {/* importing google reCaptcha v3 */}
        <script src={`https://www.google.com/recaptcha/api.js?render=${process.env.GOOGLE_SITE_KEY}`} async defer></script>
      </head>
      <body className={`${inter.className} layout`}>
        <Suspense>
          <PostHogPageview />
        </Suspense>
        <StyledJsxRegistry>
          <header className="layout__header">
            <Navbar isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
          </header>
          <main className="layout__main">{children}</main>
          <Loader />
          <AuthBox />
          <Toaster />
          <BroadCastChannel />
          <RatingContainer userInfo={userInfo} isLoggedIn={isLoggedIn} authToken={authToken} />
          <MemberRegisterDialog />
          {/* <TeamRegisterDialog /> */}
          <CookieChecker isLoggedIn={isLoggedIn} />
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
