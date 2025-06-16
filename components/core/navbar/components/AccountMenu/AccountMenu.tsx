import React, { useCallback, useEffect, useState } from 'react';
import { Menu } from '@base-ui-components/react/menu';
import { Avatar } from '@base-ui-components/react/avatar';

import { useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { IUserInfo } from '@/types/shared.types';
import Link from 'next/link';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { clearAllAuthCookies } from '@/utils/third-party.helper';
import { toast } from 'react-toastify';
import { EVENTS, TOAST_MESSAGES } from '@/utils/constants';
import { createLogoutChannel } from '@/components/core/login/broadcast-channel';
import { usePostHog } from 'posthog-js/react';

import s from './AccountMenu.module.scss';
import { useGetAppNotifications } from '@/services/notifications/hooks/useGetAppNotifications';
import { NotificationsMenu } from '@/components/core/navbar/components/NotificationsMenu';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { isNumber } from 'lodash';
import { useMember } from '@/services/members/hooks/useMember';
import { useLocalStorageParam } from '@/hooks/useLocalStorageParam';

interface Props {
  userInfo: IUserInfo;
  authToken: string;
  isLoggedIn: boolean;
  profileFilledPercent?: number | null;
}

export const AccountMenu = ({ userInfo, authToken, isLoggedIn, profileFilledPercent }: Props) => {
  const menuTriggerRef = React.useRef<HTMLButtonElement>(null);
  const defaultAvatarImage = useDefaultAvatar(userInfo?.name);
  const analytics = useCommonAnalytics();
  const postHogProps = usePostHog();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const { data: member, isLoading } = useMember(userInfo.uid);
  const [hideCompleteProfile] = useLocalStorageParam('complete_profile_bar', false);
  const isProfileFilled = member?.memberInfo.telegramHandler && member?.memberInfo.officeHours && member?.memberInfo.skills.length > 0;
  const hideProfileStatus = !userInfo || isProfileFilled || hideCompleteProfile || isLoading;

  const handleLogout = useCallback(() => {
    clearAllAuthCookies();
    document.dispatchEvent(new CustomEvent('init-privy-logout'));
    toast.success(TOAST_MESSAGES.LOGOUT_MSG);
    createLogoutChannel().postMessage('logout');
    postHogProps.reset();
  }, [postHogProps]);

  const { data: notifications, refetch } = useGetAppNotifications(userInfo.uid, authToken);

  useEffect(() => {
    function getAllNotifications(status: boolean) {
      if (isLoggedIn && status) {
        refetch();
      }
    }

    document.addEventListener(EVENTS.GET_NOTIFICATIONS, (e: any) => getAllNotifications(e?.detail?.status));

    return function () {
      document.removeEventListener(EVENTS.GET_NOTIFICATIONS, (e: any) => getAllNotifications(e?.detail?.status));
    };
  }, [isLoggedIn, refetch]);

  return (
    <>
      <Menu.Root modal={false}>
        <Menu.Trigger className={s.Button} ref={menuTriggerRef}>
          <Avatar.Root className={s.Avatar}>
            <Avatar.Image src={userInfo?.profileImageUrl || defaultAvatarImage} width="40" height="40" className={s.Image} />
            <Avatar.Fallback className={s.Fallback}>{userInfo?.name}</Avatar.Fallback>
          </Avatar.Root>
          {notifications?.length > 0 && <div className={clsx(s.notificationsCount, s.absolute)}>{notifications?.length}</div>}
          <ChevronDownIcon className={s.ButtonIcon} />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner className={s.Positioner} align="end" sideOffset={10}>
            <Menu.Popup className={s.Popup}>
              <Menu.Item
                className={s.Item}
                onClick={() => {
                  router.push(`/members/${userInfo.uid}`);
                }}
              >
                <UserIcon /> {userInfo.name ?? userInfo.email} {/*{isNumber(profileFilledPercent) && profileFilledPercent !== 100 && (*/}
                {/*  <span className={s.itemSub}>*/}
                {/*    Filled <div className={s.notificationsCount}>{profileFilledPercent}%</div>*/}
                {/*  </span>*/}
                {/*)}*/}
              </Menu.Item>
              <Menu.Item className={s.Item} onClick={() => setShowNotifications(true)}>
                <NotificationsIcon /> Notifications
                <div className={s.itemSub}>{notifications?.length > 0 && <div className={s.notificationsCount}>{notifications?.length}</div>}</div>
              </Menu.Item>
              <Link target="_blank" href={process.env.PROTOSPHERE_URL ?? ''}>
                <Menu.Item className={s.Item} onClick={() => analytics.onNavGetHelpItemClicked('ProtoSphere', getAnalyticsUserInfo(userInfo))}>
                  <MessageIcon /> ProtoSphere{' '}
                  <span className={s.itemSub}>
                    Forum <LinkIcon />
                  </span>
                </Menu.Item>
              </Link>
              <div className={s.SeparatorWrapper}>
                Support
                <Menu.Separator className={s.Separator} />
              </div>
              <Link target="_blank" href={process.env.GET_SUPPORT_URL ?? ''}>
                <Menu.Item className={s.Item} onClick={() => analytics.onNavGetHelpItemClicked('Get Support', getAnalyticsUserInfo(userInfo))}>
                  <HelpIcon /> Get Support{' '}
                  <span className={s.itemSub}>
                    <LinkIcon />
                  </span>
                </Menu.Item>
              </Link>
              <Link href="/changelog">
                <Menu.Item className={s.Item} onClick={() => analytics.onNavGetHelpItemClicked('Changelog', getAnalyticsUserInfo(userInfo))}>
                  <ChangeLogIcon /> Changelog
                </Menu.Item>
              </Link>
              <div className={s.SeparatorWrapper}>
                Settings
                <Menu.Separator className={s.Separator} />
              </div>
              <Link href="/settings/profile">
                <Menu.Item className={s.Item} onClick={() => analytics.onNavGetHelpItemClicked('Settings Profile', getAnalyticsUserInfo(userInfo))}>
                  <SettingsIcon /> Account Settings
                </Menu.Item>
              </Link>
              <Menu.Item className={s.Item} onClick={handleLogout}>
                <LogoutIcon /> Logout
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
      <NotificationsMenu isMobileView={false} notifications={notifications} open={showNotifications} onClose={() => setShowNotifications(false)} userInfo={userInfo} />
    </>
  );
};

function ChevronDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" {...props}>
      <path d="M1 3.5L5 7.5L9 3.5" stroke="currentcolor" strokeWidth="1.5" />
    </svg>
  );
}

function UserIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8 3.8125C9.3125 3.8125 10.4062 4.90625 10.4062 6.21875C10.4062 7.55859 9.3125 8.625 8 8.625C6.66016 8.625 5.59375 7.55859 5.59375 6.21875C5.59375 4.90625 6.66016 3.8125 8 3.8125ZM8 7.3125C8.60156 7.3125 9.09375 6.84766 9.09375 6.21875C9.09375 5.61719 8.60156 5.125 8 5.125C7.37109 5.125 6.90625 5.61719 6.90625 6.21875C6.90625 6.84766 7.37109 7.3125 8 7.3125ZM8 0.75C11.8555 0.75 15 3.89453 15 7.75C15 11.6328 11.8555 14.75 8 14.75C4.11719 14.75 1 11.6328 1 7.75C1 3.89453 4.11719 0.75 8 0.75ZM8 13.4375C9.25781 13.4375 10.4336 13.0273 11.3906 12.3164C10.9258 11.4141 9.99609 10.8125 8.95703 10.8125H7.01562C5.97656 10.8125 5.04688 11.3867 4.58203 12.3164C5.53906 13.0273 6.71484 13.4375 8 13.4375ZM12.375 11.3867C13.1953 10.4023 13.6875 9.14453 13.6875 7.75C13.6875 4.63281 11.1172 2.0625 8 2.0625C4.85547 2.0625 2.3125 4.63281 2.3125 7.75C2.3125 9.14453 2.77734 10.4023 3.59766 11.3867C4.33594 10.2383 5.59375 9.5 7.01562 9.5H8.95703C10.3789 9.5 11.6367 10.2383 12.375 11.3867Z"
        fill="#64748B"
      />
    </svg>
  );
}

function NotificationsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8.875 1.625V2.11719C10.8438 2.44531 12.375 4.16797 12.375 6.21875V7.14844C12.375 8.37891 12.7852 9.58203 13.5508 10.5664L13.9609 11.0586C14.125 11.2773 14.1523 11.5508 14.043 11.7695C13.9336 11.9883 13.7148 12.125 13.4688 12.125H2.53125C2.25781 12.125 2.03906 11.9883 1.92969 11.7695C1.82031 11.5508 1.84766 11.2773 2.01172 11.0586L2.42188 10.5664C3.1875 9.58203 3.625 8.37891 3.625 7.14844V6.21875C3.625 4.16797 5.12891 2.44531 7.125 2.11719V1.625C7.125 1.16016 7.50781 0.75 8 0.75C8.46484 0.75 8.875 1.16016 8.875 1.625ZM7.78125 3.375C6.19531 3.375 4.9375 4.66016 4.9375 6.21875V7.14844C4.9375 8.46094 4.55469 9.71875 3.84375 10.8125H12.1289C11.418 9.71875 11.0625 8.46094 11.0625 7.14844V6.21875C11.0625 4.66016 9.77734 3.375 8.21875 3.375H7.78125ZM9.75 13C9.75 13.4648 9.55859 13.9297 9.23047 14.2578C8.90234 14.5859 8.4375 14.75 8 14.75C7.53516 14.75 7.07031 14.5859 6.74219 14.2578C6.41406 13.9297 6.25 13.4648 6.25 13H9.75Z"
        fill="#64748B"
      />
    </svg>
  );
}

function MessageIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M10.8438 4.6875C11.1992 4.6875 11.5 4.98828 11.5 5.34375C11.5 5.72656 11.1992 6 10.8438 6H5.15625C4.77344 6 4.5 5.72656 4.5 5.34375C4.5 4.98828 4.77344 4.6875 5.15625 4.6875H10.8438ZM8.21875 7.3125C8.57422 7.3125 8.875 7.61328 8.875 7.96875C8.875 8.35156 8.57422 8.625 8.21875 8.625H5.15625C4.77344 8.625 4.5 8.35156 4.5 7.96875C4.5 7.61328 4.77344 7.3125 5.15625 7.3125H8.21875ZM13.2227 0.75C14.207 0.75 14.9727 1.54297 14.9727 2.5V10.3203C14.9727 11.25 14.1797 12.043 13.2227 12.043H9.28516L5.86719 14.6133C5.64844 14.75 5.34766 14.6133 5.34766 14.3398V12.0703H2.72266C1.73828 12.0703 0.972656 11.3047 0.972656 10.3477V2.5C0.972656 1.54297 1.73828 0.75 2.72266 0.75H13.2227ZM13.6875 10.375V2.5C13.6875 2.28125 13.4688 2.0625 13.25 2.0625H2.75C2.50391 2.0625 2.3125 2.28125 2.3125 2.5V10.375C2.3125 10.6211 2.50391 10.8125 2.75 10.8125H6.6875V12.4531L8.875 10.8125H13.25C13.4688 10.8125 13.6875 10.6211 13.6875 10.375Z"
        fill="#64748B"
      />
    </svg>
  );
}

function LinkIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M0.84375 8.93359C0.953125 9.07031 1.11719 9.125 1.28125 9.125C1.47266 9.125 1.63672 9.07031 1.74609 8.93359L8.0625 2.61719V7.59375C8.0625 7.97656 8.36328 8.25 8.71875 8.25C9.10156 8.25 9.375 7.97656 9.375 7.59375V1.03125C9.375 0.675781 9.10156 0.375 8.71875 0.375H2.15625C1.80078 0.375 1.5 0.675781 1.5 1.03125C1.5 1.41406 1.80078 1.6875 2.15625 1.6875H7.16016L0.84375 8.00391C0.570312 8.27734 0.570312 8.6875 0.84375 8.93359Z"
        fill="#E2E8F0"
      />
    </svg>
  );
}

function HelpIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8 0.75C11.8555 0.75 15 3.89453 15 7.75C15 11.6328 11.8555 14.75 8 14.75C4.11719 14.75 1 11.6328 1 7.75C1 3.89453 4.11719 0.75 8 0.75ZM8 13.4375C11.1172 13.4375 13.6875 10.8945 13.6875 7.75C13.6875 4.63281 11.1172 2.0625 8 2.0625C4.85547 2.0625 2.3125 4.63281 2.3125 7.75C2.3125 10.8945 4.85547 13.4375 8 13.4375ZM8 9.9375C8.46484 9.9375 8.875 10.3203 8.875 10.8125C8.875 11.3047 8.46484 11.6875 8 11.6875C7.48047 11.6875 7.125 11.3047 7.125 10.8125C7.125 10.3203 7.50781 9.9375 8 9.9375ZM8.90234 4.25C9.99609 4.25 10.8438 5.09766 10.8164 6.16406C10.8164 6.82031 10.4609 7.44922 9.88672 7.80469L8.65625 8.57031V8.625C8.65625 8.98047 8.35547 9.28125 8 9.28125C7.64453 9.28125 7.34375 8.98047 7.34375 8.625V8.1875C7.34375 7.96875 7.45312 7.75 7.67188 7.61328L9.23047 6.68359C9.42188 6.57422 9.53125 6.38281 9.53125 6.16406C9.53125 5.83594 9.23047 5.5625 8.875 5.5625H7.48047C7.15234 5.5625 6.90625 5.83594 6.90625 6.16406C6.90625 6.51953 6.60547 6.82031 6.25 6.82031C5.89453 6.82031 5.59375 6.51953 5.59375 6.16406C5.59375 5.09766 6.44141 4.25 7.50781 4.25H8.90234Z"
        fill="#64748B"
      />
    </svg>
  );
}

function ChangeLogIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M8 0.75C11.8555 0.75 15 3.89453 15 7.75C15 11.6328 11.8555 14.75 8 14.75C6.55078 14.75 5.23828 14.3398 4.11719 13.6016C3.81641 13.4102 3.73438 13 3.92578 12.6992C4.14453 12.3984 4.55469 12.3164 4.85547 12.5078C5.75781 13.1094 6.82422 13.4375 8 13.4375C11.1172 13.4375 13.6875 10.8945 13.6875 7.75C13.6875 4.63281 11.1172 2.0625 8 2.0625C5.97656 2.0625 4.19922 3.12891 3.1875 4.6875H4.71875C5.07422 4.6875 5.375 4.98828 5.375 5.34375C5.375 5.72656 5.07422 6 4.71875 6H1.65625C1.27344 6 1 5.72656 1 5.34375V2.28125C1 1.92578 1.27344 1.625 1.65625 1.625C2.01172 1.625 2.3125 1.92578 2.3125 2.28125V3.67578C3.57031 1.92578 5.64844 0.75 8 0.75ZM8 4.25C8.35547 4.25 8.65625 4.55078 8.65625 4.90625V7.50391L10.4062 9.25391C10.6797 9.52734 10.6797 9.9375 10.4062 10.1836C10.1602 10.457 9.75 10.457 9.50391 10.1836L7.53516 8.21484C7.39844 8.10547 7.34375 7.94141 7.34375 7.75V4.90625C7.34375 4.55078 7.61719 4.25 8 4.25Z"
        fill="#64748B"
      />
    </svg>
  );
}

function SettingsIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M5.375 7.75C5.375 6.30078 6.52344 5.125 8 5.125C9.44922 5.125 10.625 6.30078 10.625 7.75C10.625 9.19922 9.44922 10.375 8 10.375C6.52344 10.375 5.375 9.19922 5.375 7.75ZM8 6.4375C7.26172 6.4375 6.6875 7.03906 6.6875 7.75C6.6875 8.48828 7.26172 9.0625 8 9.0625C8.71094 9.0625 9.3125 8.48828 9.3125 7.75C9.3125 7.03906 8.71094 6.4375 8 6.4375ZM9.01172 0.75C9.61328 0.75 10.1328 1.1875 10.2695 1.76172L10.4883 2.66406C10.7344 2.77344 10.9531 2.91016 11.1445 3.04688L12.0469 2.77344C12.6211 2.60938 13.25 2.85547 13.5508 3.375L14.5625 5.15234C14.8633 5.67188 14.7539 6.32812 14.3164 6.73828L13.6602 7.36719C13.6602 7.50391 13.6875 7.64062 13.6875 7.75C13.6875 7.88672 13.6602 8.02344 13.6602 8.13281L14.3164 8.78906C14.7539 9.19922 14.8633 9.85547 14.5625 10.375L13.5508 12.1523C13.25 12.6719 12.6211 12.918 12.0469 12.7539L11.1445 12.4805C10.9531 12.6172 10.7344 12.7539 10.4883 12.8633L10.2695 13.7656C10.1328 14.3398 9.61328 14.75 9.01172 14.75H6.96094C6.35938 14.75 5.83984 14.3398 5.70312 13.7656L5.48438 12.8633C5.23828 12.7539 5.01953 12.6172 4.82812 12.4805L3.92578 12.7539C3.35156 12.918 2.72266 12.6719 2.42188 12.1523L1.41016 10.375C1.10938 9.85547 1.21875 9.19922 1.65625 8.78906L2.3125 8.13281C2.3125 8.02344 2.3125 7.88672 2.3125 7.75C2.3125 7.64062 2.3125 7.50391 2.3125 7.36719L1.65625 6.73828C1.21875 6.32812 1.10938 5.67188 1.41016 5.15234L2.42188 3.375C2.72266 2.85547 3.35156 2.60938 3.92578 2.77344L4.82812 3.04688C5.01953 2.91016 5.23828 2.77344 5.48438 2.66406L5.70312 1.76172C5.83984 1.1875 6.35938 0.75 6.96094 0.75H9.01172ZM6.60547 3.59375L6.30469 3.73047C5.94922 3.86719 5.62109 4.05859 5.34766 4.27734L5.07422 4.49609L3.57031 4.03125L2.55859 5.80859L3.67969 6.875L3.65234 7.20312C3.625 7.39453 3.625 7.58594 3.625 7.75C3.625 7.94141 3.625 8.13281 3.65234 8.32422L3.67969 8.65234L2.55859 9.71875L3.57031 11.4961L5.07422 11.0312L5.34766 11.25C5.62109 11.4688 5.94922 11.6602 6.30469 11.7969L6.60547 11.9336L6.96094 13.4375H9.01172L9.36719 11.9336L9.66797 11.7969C10.0234 11.6602 10.3516 11.4688 10.625 11.25L10.8984 11.0312L12.4023 11.4961L13.4141 9.71875L12.293 8.65234L12.3203 8.32422C12.3477 8.13281 12.375 7.94141 12.375 7.75C12.375 7.58594 12.3477 7.39453 12.3203 7.20312L12.293 6.875L13.4141 5.80859L12.4023 4.03125L10.8984 4.49609L10.625 4.27734C10.3516 4.05859 10.0234 3.86719 9.66797 3.73047L9.36719 3.59375L9.01172 2.0625H6.96094L6.60547 3.59375Z"
        fill="#64748B"
      />
    </svg>
  );
}

function LogoutIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M5.59375 14.5625C5.94922 14.5625 6.25 14.8633 6.25 15.2188C6.25 15.6016 5.94922 15.875 5.59375 15.875H3.625C2.14844 15.875 1 14.7266 1 13.25V6.25C1 4.80078 2.14844 3.625 3.625 3.625H5.59375C5.94922 3.625 6.25 3.92578 6.25 4.28125C6.25 4.66406 5.94922 4.9375 5.59375 4.9375H3.625C2.88672 4.9375 2.3125 5.53906 2.3125 6.25V13.25C2.3125 13.9883 2.88672 14.5625 3.625 14.5625H5.59375ZM14.7539 9.28516C14.918 9.42188 15 9.58594 15 9.77734C15 9.96875 14.918 10.1328 14.7539 10.2695L10.5977 13.9062C10.4336 14.0703 10.2148 14.1523 9.99609 14.1523C9.85938 14.1523 9.72266 14.125 9.61328 14.0703C9.28516 13.9062 9.09375 13.6055 9.09375 13.25V11.7461H5.8125C5.18359 11.7461 4.71875 11.2539 4.71875 10.6523V8.90234C4.71875 8.27344 5.18359 7.80859 5.8125 7.80859H9.09375V6.27734C9.09375 5.92188 9.28516 5.62109 9.61328 5.45703C9.94141 5.32031 10.3242 5.375 10.5977 5.62109L14.7539 9.28516ZM10.4062 12.3203L13.332 9.75L10.4062 7.17969V9.09375H6.03125V10.4062H10.4062V12.3203Z"
        fill="#64748B"
      />
    </svg>
  );
}
