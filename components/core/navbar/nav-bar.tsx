'use client';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { usePathname } from 'next/navigation';
import React, { memo, useState } from 'react';
import LoginBtn from './login-btn';
import { ApplicationSearch } from '@/components/core/application-search';
import { AccountMenu } from '@/components/core/navbar/components/AccountMenu/AccountMenu';
import { NotificationsMenu } from '@/components/core/navbar/components/NotificationsMenu';
import { useGetAppNotifications } from '@/services/notifications/hooks/useGetAppNotifications';
import { NotificationBell } from '@/components/core/NotificationBell';
import { useMemberProfileStatus } from '@/services/members/hooks/useMemberProfileStatus';
import { Signup } from './components/Signup';
import { NavigationMenu } from '@base-ui-components/react';
import { useContactSupportContext } from '@/components/ContactSupport/context/ContactSupportContext';

import { DIRECTORY_LINKS, EVENT_LINKS } from './constants/navLinks';

import { AppLogo, HelpIcon, ForumIcon, EventsIcon, DemoDayIcon, DirectoryIcon } from './components/icons';
import { NavLink } from './components/NavLink';
import { NavItemWithMenu } from './components/NavItemWithMenu';

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
  const { openModal } = useContactSupportContext();

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

  const onNavbarApplogoClicked = () => {
    analytics.onAppLogoClicked();
    closeNavigationMenu();
  };

  const { data: notifications } = useGetAppNotifications(userInfo.uid, authToken);

  const { data: profileStatus } = useMemberProfileStatus(userInfo?.uid);

  return (
    <NavigationMenu.Root className={s.Root}>
      <NavigationMenu.List className={s.List}>
        <NavLink href="/home" onClick={onNavbarApplogoClicked} className={s.logoWrapper}>
          <AppLogo />
        </NavLink>

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
        <NavigationMenu.Item className={s.menuItem}>
          <NavLink className={s.Trigger} href="/demoday" onClick={() => onNavItemClickHandler('/demoday', 'Demo Day')}>
            <DemoDayIcon /> Demo Day
          </NavLink>
        </NavigationMenu.Item>

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
