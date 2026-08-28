'use client';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { usePathname } from 'next/navigation';
import React, { memo, useEffect, useRef, useState } from 'react';
import { LoginBtn } from './components/LoginBtn';
import { ApplicationSearch } from '@/components/core/application-search';
import { AccountMenu } from '@/components/core/navbar/components/AccountMenu/AccountMenu';
import { NotificationsMenu } from '@/components/core/navbar/components/NotificationsMenu';
import { useGetAppNotifications } from '@/services/notifications/hooks/useGetAppNotifications';
import { NotificationBell } from '@/components/core/NotificationBell';
import { useMemberProfileStatus } from '@/services/members/hooks/useMemberProfileStatus';
import { Signup } from './components/Signup';
import { NavigationMenu } from '@base-ui-components/react';
import { useContactSupportStore } from '@/services/contact-support/store';

import { DIRECTORY_LINKS, EVENT_LINKS, DEMO_DAY_LINK, DEMO_DAY_ANALYTICS_LINK } from './constants/navLinks';

import { useDemoDayAnalyticsAccess } from '@/services/rbac/hooks/useDemoDayAnalyticsAccess';

import { NavLink } from './components/NavLink';
import { NavItemWithMenu } from './components/NavItemWithMenu';
import { MoreNavItems } from './components/navItems/MoreNavItems';
import { PLInfraNavItems } from './components/navItems/PLInfraNavItems';
import {
  AppLogo,
  HelpIcon,
  ForumIcon,
  EventsIcon,
  DemoDayIcon,
  DirectoryIcon,
  MoreIcon,
  HomeIcon,
} from './components/icons';
import { useHasNewNews } from '@/services/team-news/hooks/useHasNewNews';

import s from './NavBar.module.scss';

interface INavbar {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

function Navbar(props: Readonly<INavbar>) {
  const pathName = usePathname();
  const userInfo = props?.userInfo;
  const isLoggedIn = props?.isLoggedIn;
  const analytics = useCommonAnalytics();
  const authToken = props?.authToken;
  const [showNotifications, setShowNotifications] = useState(false);
  const { openModal } = useContactSupportStore((s) => s.actions);
  const hasNewNews = useHasNewNews();

  const closeNavigationMenu = () => {
    setTimeout(() => {
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        keyCode: 27,
        which: 27,
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);

      setTimeout(() => {
        const stillOpen = document.querySelectorAll('[data-state="open"]');
        if (stillOpen.length > 0) {
          const clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: 0,
            clientY: 0,
          });
          document.body.dispatchEvent(clickEvent);
        }
      }, 100);
    }, 50);
  };

  const onNavItemClickHandler = (url: string, name: string) => {
    if (pathName !== url) {
      analytics.onNavItemClicked(name, getAnalyticsUserInfo(userInfo));
    }
    closeNavigationMenu();
  };

  // Report the dot once per page load, the first time it turns on — it is the
  // denominator for navbar-home-clicked, which measures nothing without one.
  // Ref-guarded rather than keyed on `hasNewNews` so a flip back to false and
  // on again (a refetch landing mid-session) doesn't re-report the same dot.
  const dotReportedRef = useRef(false);
  useEffect(() => {
    if (dotReportedRef.current || !hasNewNews) return;
    dotReportedRef.current = true;
    analytics.onHomeNewNewsDotShown();
  }, [analytics, hasNewNews]);

  const onHomeNavClickHandler = () => {
    // Same already-there guard the generic handler uses: clicking Home from
    // /home isn't a clickthrough, and counting it would inflate the dot's CTR.
    if (pathName !== '/home') {
      analytics.onHomeNavClicked('desktop-nav', hasNewNews);
    }
    onNavItemClickHandler('/home', 'Home');
  };

  const onNavbarApplogoClicked = () => {
    analytics.onAppLogoClicked();
    closeNavigationMenu();
  };

  const { data: notifications } = useGetAppNotifications(userInfo.uid, authToken);

  const { data: profileStatus } = useMemberProfileStatus(userInfo?.uid);

  const { hasAccess: hasDemoDayAnalyticsAccess } = useDemoDayAnalyticsAccess();

  return (
    <NavigationMenu.Root className={s.Root}>
      <NavigationMenu.List className={s.List}>
        <NavLink href="/home" onClick={onNavbarApplogoClicked} className={s.logoWrapper}>
          <AppLogo />
        </NavLink>

        {/* The logo already links to /home, but a logo is not a nav item: it
            carries no label, and a dot on it reads as decoration. */}
        <NavigationMenu.Item className={s.menuItem}>
          <NavLink className={s.Trigger} href="/home" onClick={onHomeNavClickHandler}>
            <HomeIcon /> Home
            {hasNewNews && (
              <>
                <span className={s.newsDot} aria-hidden />
                {/* The dot is the whole message, so it needs to survive not
                    being seen. Not a live region: this renders on every page,
                    and announcing it on each navigation would be noise. */}
                <span className={s.srOnly}>New news</span>
              </>
            )}
          </NavLink>
        </NavigationMenu.Item>

        <NavItemWithMenu
          icon={<DirectoryIcon />}
          label="Directory"
          items={DIRECTORY_LINKS}
          onNavItemClickHandler={onNavItemClickHandler}
        />

        <NavItemWithMenu
          icon={<EventsIcon />}
          label="Events"
          items={EVENT_LINKS}
          onNavItemClickHandler={onNavItemClickHandler}
        />

        <NavigationMenu.Item className={s.menuItem}>
          <NavLink className={s.Trigger} href="/forum?cid=0" onClick={() => onNavItemClickHandler('/forum', 'Forum')}>
            <ForumIcon /> Forum
          </NavLink>
        </NavigationMenu.Item>
        {hasDemoDayAnalyticsAccess ? (
          <NavItemWithMenu
            icon={<DemoDayIcon />}
            label="Demo Day"
            items={[DEMO_DAY_LINK, DEMO_DAY_ANALYTICS_LINK]}
            onNavItemClickHandler={onNavItemClickHandler}
          />
        ) : (
          <NavigationMenu.Item className={s.menuItem}>
            <NavLink
              className={s.Trigger}
              href="/demoday"
              onClick={() => onNavItemClickHandler('/demoday', 'Demo Day')}
            >
              <DemoDayIcon /> Demo Day
            </NavLink>
          </NavigationMenu.Item>
        )}

        <MoreNavItems onNavItemClickHandler={onNavItemClickHandler} />
        <PLInfraNavItems onNavItemClickHandler={onNavItemClickHandler} />

        <div className={s.right}>
          <NotificationsMenu
            isMobileView
            notifications={notifications}
            open={showNotifications}
            onClose={() => setShowNotifications(false)}
            userInfo={userInfo}
          />
          <ApplicationSearch isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />

          <div className={s.supportButton}>
            <HelpIcon onClick={() => openModal()} />
          </div>
          <NotificationBell isLoggedIn={isLoggedIn} />
          {isLoggedIn && userInfo?.uid && (
            <AccountMenu
              userInfo={userInfo}
              authToken={authToken}
              isLoggedIn
              profileFilledPercent={profileStatus?.completeness}
            />
          )}
          {!isLoggedIn && (
            <div className={s.signInWrapper}>
              <Signup />
              <LoginBtn />
            </div>
          )}
        </div>
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          className={s.Positioner}
          sideOffset={10}
          collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
        >
          <NavigationMenu.Popup className={s.Popup}>
            <NavigationMenu.Viewport className={s.Viewport} />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

export default memo(Navbar);
