'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

import Navbar from '@/components/core/navbar/nav-bar';
import { CompleteYourProfile } from '@/components/core/navbar/components/CompleteYourProfile';
import { DomainMigrationBanner } from '@/components/core/navbar/components/DomainMigrationBanner';
import { PlaaSnapshotBar } from '@/components/core/navbar/components/PlaaSnapshotBar';
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

  /* The header is sticky, so anything inside it stays pinned. The PLAA snapshot
     bar is meant to hug the top and then get out of the way, so it collapses
     once the page is scrolled. `useHeaderHeightVar` observes the header, so the
     published `--app-header-height` follows the collapse and everything that
     offsets from it (the PLAA sidebar, overlays) stays aligned. */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    /* Capture phase: the app scrolls an inner container, not the window, so a
       bubbling listener on window would never fire. */
    const onScroll = (event: Event) => {
      const target = event.target;
      const top =
        target === document || target === document.documentElement
          ? window.scrollY
          : (target as HTMLElement)?.scrollTop ?? 0;
      setScrolled(top > 24);
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, []);

  if (isBareRoute(pathname ?? '')) return null;

  return (
    /* The bars below are stacked *inside* this element, so its height is the
       chrome height the rest of the app offsets from — which is why it is
       measured rather than assumed. See `useHeaderHeightVar`. */
    <header className="layout__header" ref={headerRef}>
      <DomainMigrationBanner />
      {/* <DemoDayBanner /> */}
      {/* Above the navbar, matching the live site. The bar gates itself to
          /alignment-asset routes, so it costs nothing elsewhere. */}
      <div className={`layout__snapshotBar ${scrolled ? 'layout__snapshotBar--collapsed' : ''}`}>
        <PlaaSnapshotBar />
      </div>
      {/*<SubscribeToRecoomendations userInfo={userInfo} />*/}
      <CompleteYourProfile />
      <Navbar isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
    </header>
  );
}
