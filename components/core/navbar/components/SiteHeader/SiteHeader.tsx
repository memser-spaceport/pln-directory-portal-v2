'use client';

import { usePathname } from 'next/navigation';

import Navbar from '@/components/core/navbar/nav-bar';
import { PlaaBanner } from '@/components/core/navbar/components/PlaaBanner';
import { CompleteYourProfile } from '@/components/core/navbar/components/CompleteYourProfile';
import { IUserInfo } from '@/types/shared.types';
import { isBareRoute } from '@/utils/isBareRoute';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

/** Hidden on bare/full-screen document routes (see isBareRoute) — those pages want no site chrome at all. */
export function SiteHeader({ userInfo, isLoggedIn, authToken }: Props) {
  const pathname = usePathname();
  if (isBareRoute(pathname ?? '')) return null;

  return (
    <header className="layout__header">
      {/* <DemoDayBanner /> */}
      <PlaaBanner />
      {/*<SubscribeToRecoomendations userInfo={userInfo} />*/}
      <CompleteYourProfile />
      <Navbar isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
    </header>
  );
}
