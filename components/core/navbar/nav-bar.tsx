'use client';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import LoginBtn from './login-btn';
import { ApplicationSearch } from '@/components/core/application-search';
import { AccountMenu } from '@/components/core/navbar/components/AccountMenu/AccountMenu';
import { NotificationsMenu } from '@/components/core/navbar/components/NotificationsMenu';
import { useGetAppNotifications } from '@/services/notifications/hooks/useGetAppNotifications';
import { useMemberProfileStatus } from '@/services/members/hooks/useMemberProfileStatus';
import { Signup } from './components/Signup';
import { NotificationsQueryKeys } from '@/services/notifications/constants';
import { useQueryClient } from '@tanstack/react-query';
import { NavigationMenu } from '@base-ui-components/react';
import NextLink from 'next/link';

import s from './NavBar.module.scss';

interface INavbar {
  userInfo: IUserInfo;
  isLoggedIn: boolean;
  authToken: string;
}

export default function Navbar(props: Readonly<INavbar>) {
  const pathName = usePathname();
  const userInfo = props?.userInfo;
  const isLoggedIn = props?.isLoggedIn;
  const analytics = useCommonAnalytics();
  const authToken = props?.authToken;
  const [showNotifications, setShowNotifications] = useState(false);
  const queryClient = useQueryClient();

  const onNavItemClickHandler = (url: string, name: string) => {
    if (pathName !== url) {
      analytics.onNavItemClicked(name, getAnalyticsUserInfo(userInfo));
    }
  };

  const onNavbarApplogoClicked = () => {
    analytics.onAppLogoClicked();
  };

  const { data: notifications } = useGetAppNotifications(userInfo.uid, authToken);

  const { data: profileStatus } = useMemberProfileStatus(userInfo?.uid);

  useEffect(() => {
    function getAllNotifications(status: boolean) {
      if (isLoggedIn && status) {
        queryClient.invalidateQueries({
          queryKey: [NotificationsQueryKeys.GET_ALL_NOTIFICATIONS],
        });
      }
    }

    document.addEventListener(EVENTS.GET_NOTIFICATIONS, (e: any) => getAllNotifications(e?.detail?.status));

    return function () {
      document.removeEventListener(EVENTS.GET_NOTIFICATIONS, (e: any) => getAllNotifications(e?.detail?.status));
    };
  }, [isLoggedIn, queryClient]);

  return (
    <NavigationMenu.Root className={s.Root}>
      <NavigationMenu.List className={s.List}>
        <Link href="/home" onClick={onNavbarApplogoClicked} className={s.logoWrapper}>
          <AppLogo />
        </Link>
        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={s.Trigger}>
            <DirectoryIcon /> Directory
            <NavigationMenu.Icon className={s.Icon}>
              <ChevronDownIcon />
            </NavigationMenu.Icon>
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={s.Content}>
            <ul className={s.GridLinkList}>
              {directoryLinks.map((item) => (
                <li key={item.href}>
                  <Link className={s.LinkCard} href={item.href} onClick={() => onNavItemClickHandler(item.href, item.title)}>
                    {item.icon}
                    <div className={s.linkDetails}>
                      <h3 className={s.LinkTitle}>{item.title}</h3>
                      <p className={s.LinkDescription}>{item.description}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <Link className={s.Trigger} href="/events" onClick={() => onNavItemClickHandler('/events', 'Events')}>
            <EventsIcon /> Events
          </Link>
        </NavigationMenu.Item>
        <NavigationMenu.Item>
          <Link className={s.Trigger} href="/forum?cid=1" onClick={() => onNavItemClickHandler('/forum', 'Forum')}>
            <ForumIcon /> Forum
          </Link>
        </NavigationMenu.Item>
        <div className={s.right}>
          <NotificationsMenu isMobileView notifications={notifications} open={showNotifications} onClose={() => setShowNotifications(false)} userInfo={userInfo} />
          <ApplicationSearch isLoggedIn={isLoggedIn} userInfo={userInfo} authToken={authToken} />
          {isLoggedIn && <AccountMenu userInfo={userInfo} authToken={authToken} isLoggedIn profileFilledPercent={profileStatus?.completeness} />}
          {!isLoggedIn && (
            <>
              <a target="_blank" href={process.env.GET_SUPPORT_URL ?? ''} className={s.IconTrigger}>
                <HelpIcon />
              </a>
              <div className={s.signInWrapper}>
                <Signup />
                <LoginBtn />
              </div>
            </>
          )}
        </div>
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner className={s.Positioner} sideOffset={10} collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}>
          <NavigationMenu.Popup className={s.Popup}>
            <NavigationMenu.Viewport className={s.Viewport} />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}

function Link(props: NavigationMenu.Link.Props) {
  return (
    <NavigationMenu.Link
      render={() => (
        <NextLink href={props.href ?? ''} className={(props.className as string) ?? ''}>
          {props.children}
        </NextLink>
      )}
      {...props}
    />
  );
}

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

const TeamsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 7C15 7.79565 14.6839 8.55871 14.1213 9.12132C13.5587 9.68393 12.7956 10 12 10C11.2044 10 10.4413 9.68393 9.87868 9.12132C9.31607 8.55871 9 7.79565 9 7C9 6.20435 9.31607 5.44129 9.87868 4.87868C10.4413 4.31607 11.2044 4 12 4C12.7956 4 13.5587 4.31607 14.1213 4.87868C14.6839 5.44129 15 6.20435 15 7ZM20 9C20 9.53043 19.7893 10.0391 19.4142 10.4142C19.0391 10.7893 18.5304 11 18 11C17.4696 11 16.9609 10.7893 16.5858 10.4142C16.2107 10.0391 16 9.53043 16 9C16 8.46957 16.2107 7.96086 16.5858 7.58579C16.9609 7.21071 17.4696 7 18 7C18.5304 7 19.0391 7.21071 19.4142 7.58579C19.7893 7.96086 20 8.46957 20 9ZM16 16C16 14.9391 15.5786 13.9217 14.8284 13.1716C14.0783 12.4214 13.0609 12 12 12C10.9391 12 9.92172 12.4214 9.17157 13.1716C8.42143 13.9217 8 14.9391 8 16V19H16V16ZM8 9C8 9.53043 7.78929 10.0391 7.41421 10.4142C7.03914 10.7893 6.53043 11 6 11C5.46957 11 4.96086 10.7893 4.58579 10.4142C4.21071 10.0391 4 9.53043 4 9C4 8.46957 4.21071 7.96086 4.58579 7.58579C4.96086 7.21071 5.46957 7 6 7C6.53043 7 7.03914 7.21071 7.41421 7.58579C7.78929 7.96086 8 8.46957 8 9ZM18 19V16C18.0014 14.9833 17.7433 13.983 17.25 13.094C17.6933 12.9805 18.1568 12.9698 18.6049 13.0627C19.053 13.1556 19.474 13.3496 19.8357 13.6299C20.1974 13.9102 20.4903 14.2695 20.6921 14.6802C20.8939 15.091 20.9992 15.5424 21 16V19H18ZM6.75 13.094C6.25675 13.983 5.9986 14.9833 6 16V19H3V16C2.99981 15.542 3.10446 15.0901 3.30595 14.6789C3.50743 14.2676 3.80039 13.9079 4.16238 13.6274C4.52437 13.3469 4.94578 13.153 5.39431 13.0605C5.84284 12.9681 6.30658 12.9795 6.75 13.094Z"
      fill="currentColor"
    />
  </svg>
);

const MembersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 10C12.7956 10 13.5587 9.68393 14.1213 9.12132C14.6839 8.55871 15 7.79565 15 7C15 6.20435 14.6839 5.44129 14.1213 4.87868C13.5587 4.31607 12.7956 4 12 4C11.2044 4 10.4413 4.31607 9.87868 4.87868C9.31607 5.44129 9 6.20435 9 7C9 7.79565 9.31607 8.55871 9.87868 9.12132C10.4413 9.68393 11.2044 10 12 10ZM5 19C5 18.0807 5.18106 17.1705 5.53284 16.3212C5.88463 15.4719 6.40024 14.7003 7.05025 14.0503C7.70026 13.4002 8.47194 12.8846 9.32122 12.5328C10.1705 12.1811 11.0807 12 12 12C12.9193 12 13.8295 12.1811 14.6788 12.5328C15.5281 12.8846 16.2997 13.4002 16.9497 14.0503C17.5998 14.7003 18.1154 15.4719 18.4672 16.3212C18.8189 17.1705 19 18.0807 19 19H5Z"
      fill="currentColor"
    />
  </svg>
);

const ProjectsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.1788 2.04718C12.068 1.98427 11.932 1.98427 11.8212 2.04718L3.45761 6.77448C3.34347 6.83891 3.27295 6.9599 3.27295 7.09104V16.9092C3.27295 17.0403 3.34346 17.1613 3.45761 17.2257L11.8212 21.953C11.932 22.0157 12.068 22.0157 12.1788 21.953L20.5424 17.2257C20.6566 17.1613 20.7271 17.0403 20.7271 16.9092V7.09104C20.7271 6.9599 20.6566 6.83891 20.5424 6.77448L12.1788 2.04718ZM9.76255 11.1082L4.00013 7.72571V16.2731L8.51055 13.6199L9.76255 11.1082ZM11.6362 21.0133L4.36421 16.9029L8.00159 14.7631C8.00971 14.845 8.04547 14.9236 8.10635 14.9845C9.15472 16.0329 10.3801 16.6188 11.6361 16.7136L11.6362 21.0133ZM12.3637 21.0133V16.7136C13.6198 16.6188 14.8452 16.0329 15.8935 14.9845C15.9518 14.9261 15.9871 14.8513 15.997 14.7732L19.6344 16.9036L12.3637 21.0133ZM20 16.2748L15.4982 13.6381L14.2315 11.1121L20 7.72603V16.2748ZM19.6353 7.09695L13.9048 10.4606L12.3486 7.35799L12.3618 2.98607L19.6353 7.09695ZM11.6347 2.98808L11.6215 7.38006L10.0879 10.4561L4.36504 7.09701L11.6347 2.98808Z"
      fill="currentColor"
    />
  </svg>
);

const EventsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_3785_16476)">
      <g clipPath="url(#clip1_3785_16476)">
        <path
          d="M10 11.6666C9.76389 11.6666 9.56611 11.5866 9.40667 11.4266C9.24667 11.2672 9.16667 11.0694 9.16667 10.8333C9.16667 10.5972 9.24667 10.3991 9.40667 10.2391C9.56611 10.0797 9.76389 9.99996 10 9.99996C10.2361 9.99996 10.4342 10.0797 10.5942 10.2391C10.7536 10.3991 10.8333 10.5972 10.8333 10.8333C10.8333 11.0694 10.7536 11.2672 10.5942 11.4266C10.4342 11.5866 10.2361 11.6666 10 11.6666ZM6.66667 11.6666C6.43056 11.6666 6.2325 11.5866 6.0725 11.4266C5.91306 11.2672 5.83333 11.0694 5.83333 10.8333C5.83333 10.5972 5.91306 10.3991 6.0725 10.2391C6.2325 10.0797 6.43056 9.99996 6.66667 9.99996C6.90278 9.99996 7.10083 10.0797 7.26083 10.2391C7.42028 10.3991 7.5 10.5972 7.5 10.8333C7.5 11.0694 7.42028 11.2672 7.26083 11.4266C7.10083 11.5866 6.90278 11.6666 6.66667 11.6666ZM13.3333 11.6666C13.0972 11.6666 12.8994 11.5866 12.74 11.4266C12.58 11.2672 12.5 11.0694 12.5 10.8333C12.5 10.5972 12.58 10.3991 12.74 10.2391C12.8994 10.0797 13.0972 9.99996 13.3333 9.99996C13.5694 9.99996 13.7672 10.0797 13.9267 10.2391C14.0867 10.3991 14.1667 10.5972 14.1667 10.8333C14.1667 11.0694 14.0867 11.2672 13.9267 11.4266C13.7672 11.5866 13.5694 11.6666 13.3333 11.6666ZM10 15C9.76389 15 9.56611 14.92 9.40667 14.76C9.24667 14.6005 9.16667 14.4027 9.16667 14.1666C9.16667 13.9305 9.24667 13.7327 9.40667 13.5733C9.56611 13.4133 9.76389 13.3333 10 13.3333C10.2361 13.3333 10.4342 13.4133 10.5942 13.5733C10.7536 13.7327 10.8333 13.9305 10.8333 14.1666C10.8333 14.4027 10.7536 14.6005 10.5942 14.76C10.4342 14.92 10.2361 15 10 15ZM6.66667 15C6.43056 15 6.2325 14.92 6.0725 14.76C5.91306 14.6005 5.83333 14.4027 5.83333 14.1666C5.83333 13.9305 5.91306 13.7327 6.0725 13.5733C6.2325 13.4133 6.43056 13.3333 6.66667 13.3333C6.90278 13.3333 7.10083 13.4133 7.26083 13.5733C7.42028 13.7327 7.5 13.9305 7.5 14.1666C7.5 14.4027 7.42028 14.6005 7.26083 14.76C7.10083 14.92 6.90278 15 6.66667 15ZM13.3333 15C13.0972 15 12.8994 14.92 12.74 14.76C12.58 14.6005 12.5 14.4027 12.5 14.1666C12.5 13.9305 12.58 13.7327 12.74 13.5733C12.8994 13.4133 13.0972 13.3333 13.3333 13.3333C13.5694 13.3333 13.7672 13.4133 13.9267 13.5733C14.0867 13.7327 14.1667 13.9305 14.1667 14.1666C14.1667 14.4027 14.0867 14.6005 13.9267 14.76C13.7672 14.92 13.5694 15 13.3333 15ZM4.16667 18.3333C3.70833 18.3333 3.31583 18.1702 2.98917 17.8441C2.66306 17.5175 2.5 17.125 2.5 16.6666V4.99996C2.5 4.54163 2.66306 4.1494 2.98917 3.82329C3.31583 3.49663 3.70833 3.33329 4.16667 3.33329H5V2.49996C5 2.26385 5.07972 2.06579 5.23917 1.90579C5.39917 1.74635 5.59722 1.66663 5.83333 1.66663C6.06944 1.66663 6.2675 1.74635 6.4275 1.90579C6.58694 2.06579 6.66667 2.26385 6.66667 2.49996V3.33329H13.3333V2.49996C13.3333 2.26385 13.4133 2.06579 13.5733 1.90579C13.7328 1.74635 13.9306 1.66663 14.1667 1.66663C14.4028 1.66663 14.6006 1.74635 14.76 1.90579C14.92 2.06579 15 2.26385 15 2.49996V3.33329H15.8333C16.2917 3.33329 16.6842 3.49663 17.0108 3.82329C17.3369 4.1494 17.5 4.54163 17.5 4.99996V16.6666C17.5 17.125 17.3369 17.5175 17.0108 17.8441C16.6842 18.1702 16.2917 18.3333 15.8333 18.3333H4.16667ZM4.16667 16.6666H15.8333V8.33329H4.16667V16.6666Z"
          fill="#475569"
        />
      </g>
    </g>
    <defs>
      <clipPath id="clip0_3785_16476">
        <rect width="20" height="20" fill="white" />
      </clipPath>
      <clipPath id="clip1_3785_16476">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const ForumIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20.25 7.5H17.25V4.5C17.25 4.10218 17.092 3.72064 16.8107 3.43934C16.5294 3.15804 16.1478 3 15.75 3H3.75C3.35218 3 2.97064 3.15804 2.68934 3.43934C2.40804 3.72064 2.25 4.10218 2.25 4.5V16.5C2.25044 16.6411 2.29068 16.7792 2.36608 16.8985C2.44149 17.0177 2.54901 17.1133 2.67629 17.1742C2.80358 17.2351 2.94546 17.2589 3.08564 17.2428C3.22581 17.2266 3.3586 17.1713 3.46875 17.0831L6.75 14.4375V17.25C6.75 17.6478 6.90804 18.0294 7.18934 18.3107C7.47064 18.592 7.85218 18.75 8.25 18.75H17.0241L20.5312 21.5831C20.664 21.6905 20.8293 21.7493 21 21.75C21.1989 21.75 21.3897 21.671 21.5303 21.5303C21.671 21.3897 21.75 21.1989 21.75 21V9C21.75 8.60218 21.592 8.22064 21.3107 7.93934C21.0294 7.65804 20.6478 7.5 20.25 7.5ZM6.23906 12.9169L3.75 14.9297V4.5H15.75V12.75H6.71063C6.53897 12.75 6.37252 12.8089 6.23906 12.9169ZM20.25 19.4297L17.7609 17.4169C17.6282 17.3095 17.4629 17.2507 17.2922 17.25H8.25V14.25H15.75C16.1478 14.25 16.5294 14.092 16.8107 13.8107C17.092 13.5294 17.25 13.1478 17.25 12.75V9H20.25V19.4297Z"
      fill="currentColor"
    />
  </svg>
);

const DirectoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.875 5.62501H10.2586L8.125 3.49141C8.00935 3.37483 7.87168 3.28241 7.71999 3.21951C7.5683 3.1566 7.40562 3.12448 7.24141 3.12501H3.125C2.79348 3.12501 2.47554 3.2567 2.24112 3.49112C2.0067 3.72554 1.875 4.04349 1.875 4.37501V15.6734C1.87541 15.992 2.00214 16.2974 2.22739 16.5226C2.45263 16.7479 2.75802 16.8746 3.07656 16.875H16.9445C17.2575 16.8746 17.5575 16.7501 17.7788 16.5288C18.0001 16.3075 18.1246 16.0075 18.125 15.6945V6.87501C18.125 6.54349 17.9933 6.22554 17.7589 5.99112C17.5245 5.7567 17.2065 5.62501 16.875 5.62501ZM3.125 4.37501H7.24141L8.49141 5.62501H3.125V4.37501ZM16.875 15.625H3.125V6.87501H16.875V15.625Z"
      fill="#475569"
    />
  </svg>
);

const AppLogo = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M39.9824 13.8291C40.161 13.7268 40.3906 13.8548 40.3906 14.085V31.6504C40.3906 31.8548 40.2888 32.0335 40.1104 32.1357L24.9072 40.8291C24.7288 40.9569 24.4993 40.804 24.499 40.5996V33.0566C24.499 32.8521 24.6007 32.6726 24.7793 32.5703L32.917 27.8916C33.0954 27.7893 33.1972 27.6106 33.1973 27.4062L33.1719 18.0225C33.1974 17.8179 33.3 17.6394 33.4785 17.5371L39.9824 13.8291ZM15.749 28.9912C15.749 28.7613 15.9787 28.6334 16.1572 28.7607L22.7393 32.5449C22.9177 32.6472 23.0195 32.8268 23.0195 33.0312V40.5996C23.0192 40.8039 22.7898 40.9313 22.6113 40.8291L16.0303 37.0449C15.8517 36.9427 15.7491 36.7641 15.749 36.5596V28.9912ZM7 13.9062C7 13.7017 7.25515 13.5479 7.4082 13.6758L22.7393 22.4199C22.9177 22.5733 23.0449 22.7526 23.0449 22.957L23.0195 30.6279C23.0193 30.8066 22.8404 30.8577 22.7129 30.8066L14.6777 26.2041C14.4992 26.1022 14.2695 26.2302 14.2695 26.4346V35.5107C14.2695 35.7152 14.0154 35.8687 13.8623 35.7412L7.28027 32.0078C7.10199 31.9055 7 31.7268 7 31.5225V13.9062ZM31.2842 18.8154C31.4627 18.6876 31.6922 18.8405 31.6924 19.0449V26.7158C31.6923 26.818 31.6409 26.9198 31.5645 26.9453L24.9072 30.7559C24.7287 30.8835 24.4991 30.7299 24.499 30.5254V22.9824C24.4991 22.7781 24.601 22.5992 24.7793 22.5225L31.2842 18.8154ZM14.7295 8.07617C14.9078 7.99967 15.1116 7.99967 15.3154 8.07617L30.6465 16.8203C30.825 16.9226 30.825 17.2044 30.6465 17.3066L24.1416 21.0391C23.9631 21.1413 23.7596 21.1413 23.5811 21.0391L8.25 12.2949C8.09701 12.1926 8.09702 11.9119 8.25 11.8096L14.7295 8.07617ZM32.2021 8.07617C32.3807 7.97393 32.5851 7.97399 32.7637 8.07617L39.3701 11.8603C39.5487 11.9626 39.5487 12.2444 39.3701 12.3467L32.8145 16.0791C32.636 16.1812 32.4324 16.1812 32.2539 16.0791L25.6465 12.2949C25.4684 12.1925 25.4684 11.912 25.6465 11.8096L32.2021 8.07617Z"
      fill="#0F172A"
    />
  </svg>
);

function HelpIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.9375 14.0625C10.9375 14.2479 10.8825 14.4292 10.7795 14.5833C10.6765 14.7375 10.5301 14.8577 10.3588 14.9286C10.1875 14.9996 9.99896 15.0182 9.81711 14.982C9.63525 14.9458 9.4682 14.8565 9.33709 14.7254C9.20598 14.5943 9.11669 14.4273 9.08052 14.2454C9.04434 14.0635 9.06291 13.875 9.13387 13.7037C9.20482 13.5324 9.32499 13.386 9.47916 13.283C9.63333 13.18 9.81458 13.125 10 13.125C10.2486 13.125 10.4871 13.2238 10.6629 13.3996C10.8387 13.5754 10.9375 13.8139 10.9375 14.0625ZM10 5.625C8.27657 5.625 6.875 6.88672 6.875 8.4375V8.75C6.875 8.91576 6.94085 9.07473 7.05806 9.19194C7.17527 9.30915 7.33424 9.375 7.5 9.375C7.66576 9.375 7.82473 9.30915 7.94195 9.19194C8.05916 9.07473 8.125 8.91576 8.125 8.75V8.4375C8.125 7.57812 8.96641 6.875 10 6.875C11.0336 6.875 11.875 7.57812 11.875 8.4375C11.875 9.29688 11.0336 10 10 10C9.83424 10 9.67527 10.0658 9.55806 10.1831C9.44085 10.3003 9.375 10.4592 9.375 10.625V11.25C9.375 11.4158 9.44085 11.5747 9.55806 11.6919C9.67527 11.8092 9.83424 11.875 10 11.875C10.1658 11.875 10.3247 11.8092 10.4419 11.6919C10.5592 11.5747 10.625 11.4158 10.625 11.25V11.1937C12.05 10.932 13.125 9.79531 13.125 8.4375C13.125 6.88672 11.7234 5.625 10 5.625ZM18.125 10C18.125 11.607 17.6485 13.1779 16.7557 14.514C15.8629 15.8502 14.594 16.8916 13.1093 17.5065C11.6247 18.1215 9.99099 18.2824 8.41489 17.9689C6.8388 17.6554 5.39106 16.8815 4.25476 15.7452C3.11846 14.6089 2.34463 13.1612 2.03112 11.5851C1.71762 10.009 1.87852 8.37535 2.49348 6.8907C3.10844 5.40605 4.14985 4.1371 5.486 3.24431C6.82214 2.35152 8.39303 1.875 10 1.875C12.1542 1.87727 14.2195 2.73403 15.7427 4.25727C17.266 5.78051 18.1227 7.84581 18.125 10ZM16.875 10C16.875 8.64025 16.4718 7.31104 15.7164 6.18045C14.9609 5.04987 13.8872 4.16868 12.631 3.64833C11.3747 3.12798 9.99238 2.99183 8.65876 3.2571C7.32514 3.52237 6.10013 4.17715 5.13864 5.13864C4.17716 6.10013 3.52238 7.32513 3.2571 8.65875C2.99183 9.99237 3.12798 11.3747 3.64833 12.6309C4.16868 13.8872 5.04987 14.9609 6.18046 15.7164C7.31105 16.4718 8.64026 16.875 10 16.875C11.8227 16.8729 13.5702 16.1479 14.8591 14.8591C16.1479 13.5702 16.8729 11.8227 16.875 10Z"
        fill="#455468"
      />
    </svg>
  );
}

const directoryLinks = [
  {
    icon: <MembersIcon />,
    href: '/members',
    title: 'Members',
    description: 'Connect with individuals across the network',
  },
  {
    icon: <TeamsIcon />,
    href: '/teams',
    title: 'Teams',
    description: 'Discover organizations in web3, AI, neurotech and other innovation areas',
  },
  {
    icon: <ProjectsIcon />,
    href: '/projects',
    title: 'Projects',
    description: 'See what the network is building',
  },
] as const;
