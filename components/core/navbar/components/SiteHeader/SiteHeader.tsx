'use client';

import { useRef } from 'react';
import { usePathname } from 'next/navigation';

import Navbar from '@/components/core/navbar/nav-bar';
import { CompleteYourProfile } from '@/components/core/navbar/components/CompleteYourProfile';
import { DomainMigrationBanner } from '@/components/core/navbar/components/DomainMigrationBanner';
import { IUserInfo } from '@/types/shared.types';
import { isBareRoute } from '@/utils/isBareRoute';
import { useHeaderHeightVar } from './useHeaderHeightVar';

interface Props {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

/** Hidden on bare/full-screen document routes (see isBareRoute) — those pages want no site chrome at all. */
export function SiteHeader({ userInfo, isLoggedIn, authToken }: Props) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  /* Above the bare-route bail-out, because hooks cannot be conditional. It is a
     no-op there anyway: the ref stays null, so nothing is measured and the
     stylesheet default stands, which is what a page with no chrome wants. */
  useHeaderHeightVar(headerRef);

  if (isBareRoute(pathname ?? '')) return null;

  return (
    /* The bars below are stacked *inside* this element, so its height is the
       chrome height the rest of the app offsets from — which is why it is
       measured rather than assumed. See `useHeaderHeightVar`. */
    <header className="layout__header" ref={headerRef}>
      <DomainMigrationBanner />
      {/* <DemoDayBanner /> */}
      {/* <PlaaSnapshotBar /> */}
      {/*<SubscribeToRecoomendations userInfo={userInfo} />*/}
      <CompleteYourProfile />
      <Navbar isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
    </header>
  );
}
