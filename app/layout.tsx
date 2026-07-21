import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.scss';
import '../styles/index.scss';
import StyledJsxRegistry from '../providers/registry';
import React, { Suspense } from 'react';

import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import QueryProvider from '@/providers/QueryProvider';
import StoreInitializer from '@/providers/StoreInitializer';
// import { SubscribeToRecoomendations } from '@/components/core/navbar/components/SubscribeToRecoomendations';
// import { OnboardingFlowTrigger } from '@/components/page/onboarding/components/OnboardingFlowTrigger';
import PostHogIdentifier from '@/components/page/posthog-identifier';
import PostLoginRedirectHandler from '@/components/page/recommendations/components/RecommendationsPreloader/PostLoginRedirectHandler';
import { SiteHeader } from '@/components/core/navbar/components/SiteHeader';
import { LoginFlowTrigger } from '@/components/page/onboarding/components/LoginFlowTrigger';
import { UserInfoChecker, UserInfoValidator } from '@/components/core/login';
import { MobileBottomNav } from '@/components/core/MobileBottomNav';
import { DemoDayStats } from '@/components/core/DemoDayStats';
import { ContactSupport } from '@/components/ContactSupport/ContactSupport';
import { ContactSupportUrlSync } from '@/components/ContactSupport/ContactSupportUrlSync';
import { PushNotificationsProvider } from '@/providers/PushNotificationsProvider';
import {
  Loader,
  AuthBox,
  ToastContainer,
  BroadCastChannel,
  MemberRegisterDialog,
  CookieChecker,
  PostHogPageview,
  RatingContainer,
} from './ClientDynamics';

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
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userInfo, isLoggedIn, authToken } = await getCookiesFromHeaders();

  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.className} layout root`} id="body">
        <Suspense>
          <PostHogPageview />
        </Suspense>
        <StyledJsxRegistry>
          <QueryProvider>
            <NuqsAdapter>
              <PushNotificationsProvider authToken={authToken} enabled={isLoggedIn}>
                <StoreInitializer userInfo={userInfo} />
                <PostHogIdentifier />
                <ContactSupportUrlSync />
                <SiteHeader userInfo={userInfo} isLoggedIn={isLoggedIn} authToken={authToken} />
                <AuthBox isLoggedIn={isLoggedIn} />
                <ContactSupport userInfo={userInfo} />
                <DemoDayStats />
                <main className="layout__main">{children}</main>
                <MobileBottomNav />
                <Loader />
                <ToastContainer />
                <BroadCastChannel />
                <RatingContainer userInfo={userInfo} isLoggedIn={isLoggedIn} authToken={authToken} />
                <MemberRegisterDialog />
                {/* <OnboardingFlowTrigger isLoggedIn={isLoggedIn} userInfo={userInfo} /> */}
                <LoginFlowTrigger isLoggedIn={isLoggedIn} userInfo={userInfo} />
                <PostLoginRedirectHandler isLoggedIn={isLoggedIn} />
                {/* <TeamRegisterDialog /> */}
                <UserInfoChecker uid={userInfo?.uid} />
                <UserInfoValidator userInfo={userInfo} isLoggedIn={isLoggedIn} authToken={authToken} />
                <CookieChecker isLoggedIn={isLoggedIn} />
                {/*<ReactQueryDevtools initialIsOpen={false} />*/}
              </PushNotificationsProvider>
            </NuqsAdapter>
          </QueryProvider>
        </StyledJsxRegistry>
      </body>
    </html>
  );
}
