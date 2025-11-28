import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '../components/core/navbar/nav-bar';
import './globals.scss';
import '../styles/index.scss';
import StyledJsxRegistry from '../providers/registry';
import React, { Suspense } from 'react';

import { getCookiesFromHeaders } from '@/utils/next-helpers';
import dynamic from 'next/dynamic';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import QueryProvider from '@/providers/QueryProvider';
import StoreInitializer from '@/providers/StoreInitializer';
import { SubscribeToRecoomendations } from '@/components/core/navbar/components/SubscribeToRecoomendations';
import { OnboardingFlowTrigger } from '@/components/page/onboarding/components/OnboardingFlowTrigger';
import PostHogIdentifier from '@/components/page/posthog-identifier';
import PostLoginRedirectHandler from '@/components/page/recommendations/components/RecommendationsPreloader/PostLoginRedirectHandler';
import { CompleteYourProfile } from '@/components/core/navbar/components/CompleteYourProfile';
import { LoginFlowTrigger } from '@/components/page/onboarding/components/LoginFlowTrigger';
import { UserInfoChecker } from '@/components/core/login';
import { MobileBottomNav } from '@/components/core/MobileBottomNav/MobileBottomNav';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DemoDayBanner } from '@/components/core/navbar/components/DemoDayBanner';
import { DemoDayStats } from '@/components/core/DemoDayStats';

// dynamic components:
const Loader = dynamic(() => import('../components/core/loader'), { ssr: false });
const AuthBox = dynamic(() => import('@/components/core/login/AuthBox').then((m) => m.AuthBox), { ssr: false });
const ToastContainer = dynamic(() => import('@/components/core/ToastContainer'), { ssr: false });
const BroadCastChannel = dynamic(() => import('@/components/core/login/BroadcastChannel').then((m) => m.BroadcastChannel), { ssr: false });
const MemberRegisterDialog = dynamic(() => import('@/components/core/register/member-register-dialog'), { ssr: false });
const CookieChecker = dynamic(() => import('@/components/core/login/CookieChecker').then((m) => m.CookieChecker), { ssr: false });
const PostHogPageview = dynamic(() => import('@/providers/analytics-provider').then((d) => d.PostHogPageview), {
  ssr: false,
});
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
        <script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.GOOGLE_SITE_KEY}`}
          async
          defer
        ></script>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.className} layout root`} id="body">
        <Suspense>
          <PostHogPageview />
        </Suspense>
        <StyledJsxRegistry>
          <QueryProvider>
            <StoreInitializer userInfo={userInfo} />
            <PostHogIdentifier />
            <header className="layout__header">
              <DemoDayBanner />
              {false && <SubscribeToRecoomendations userInfo={userInfo} />}
              <CompleteYourProfile userInfo={userInfo} />
              <Navbar isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
            </header>
            <DemoDayStats />
            <main className="layout__main">{children}</main>
            <MobileBottomNav />
            <Loader />
            <AuthBox />
            <ToastContainer />
            <BroadCastChannel />
            <RatingContainer userInfo={userInfo} isLoggedIn={isLoggedIn} authToken={authToken} />
            <MemberRegisterDialog />
            <OnboardingFlowTrigger isLoggedIn={isLoggedIn} userInfo={userInfo} />
            <LoginFlowTrigger isLoggedIn={isLoggedIn} userInfo={userInfo} />
            <PostLoginRedirectHandler isLoggedIn={isLoggedIn} />
            {/* <TeamRegisterDialog /> */}
            <UserInfoChecker userInfo={userInfo} />
            <CookieChecker isLoggedIn={isLoggedIn} />
            {/*<ReactQueryDevtools initialIsOpen={false} />*/}
          </QueryProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
