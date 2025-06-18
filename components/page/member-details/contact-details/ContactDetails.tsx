'use client';

import { ProfileSocialLink } from '../profile-social-link';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, getProfileFromURL } from '@/utils/common.utils';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';

import s from './ContactDetails.module.scss';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { ADMIN_ROLE, TOAST_MESSAGES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { OfficeHoursHandle } from '@/components/page/member-details/office-hours-handle';
import React, { Fragment } from 'react';
import { clsx } from 'clsx';
import { EditButton } from '@/components/page/member-details/components/EditButton';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  onEdit: () => void;
}

const SOCIAL_TO_HANDLE_MAP: Record<string, string> = {
  linkedin: 'linkedinHandle',
  github: 'githubHandle',
  twitter: 'twitter',
  email: 'email',
  discord: 'discordHandle',
  telegram: 'telegramHandle',
};

const VISIBLE_HANDLES = ['linkedin', 'github', 'twitter', 'email', 'discord', 'telegram'];

export const ContactDetails = ({ member, isLoggedIn, userInfo, onEdit }: Props) => {
  const router = useRouter();
  const { visibleHandles } = member;
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const isOwner = userInfo?.uid === member.id;
  const showOfficeHours = visibleHandles?.includes('officeHours');
  const hasMissingRequiredData = !member?.telegramHandle || !member?.officeHours;
  const authAnalytics = useAuthAnalytics();
  const memberAnalytics = useMemberAnalytics();
  const showIncomplete = hasMissingRequiredData && isOwner;

  const onLoginClickHandler = () => {
    const userInfo = Cookies.get('userInfo');
    if (userInfo) {
      toast.info(TOAST_MESSAGES.LOGGED_IN_MSG);
      router.refresh();
    } else {
      authAnalytics.onLoginBtnClicked();
      router.push(`${window.location.pathname}${window.location.search}#login`);
    }
  };

  const callback = (type: string, url: string) => {
    memberAnalytics.onSocialProfileLinkClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member), type, url);
  };

  return (
    <div
      className={clsx(s.root, {
        [s.missingData]: hasMissingRequiredData && isLoggedIn && isOwner,
      })}
    >
      {showIncomplete && (
        <div className={s.missingDataHeader}>
          <WarningIcon />
          Please complete your profile to get full access to the platform.
        </div>
      )}
      <div className={s.header}>
        <h2 className={s.title}>Contact Details</h2>
        {isLoggedIn && (isAdmin || isOwner) && <EditButton onClick={onEdit} />}
      </div>
      <div className={s.container}>
        {isLoggedIn ? (
          <div className={s.social}>
            <div className={s.top}>
              <div className={s.content}>
                {VISIBLE_HANDLES?.map((item, i, arr) => {
                  const handle = (member as unknown as Record<string, string>)[SOCIAL_TO_HANDLE_MAP[item]];

                  return {
                    completed: !!handle,
                    content: (
                      <Fragment key={item}>
                        <ProfileSocialLink
                          profile={getProfileFromURL(handle, item)}
                          height={24}
                          width={24}
                          callback={callback}
                          type={item}
                          handle={handle}
                          logo={getLogoByProvider(item, !handle)}
                          className={clsx({
                            [s.incomplete]: !handle,
                          })}
                        />
                        {i === arr.length - 1 ? null : <div className={s.divider} />}
                      </Fragment>
                    ),
                  };
                })
                  .sort((a, b) => (a.completed ? -1 : 1))
                  .map((item) => item.content)}
                {!member?.officeHours && (
                  <ProfileSocialLink
                    profile=""
                    height={24}
                    width={24}
                    callback={callback}
                    type=""
                    handle=""
                    logo={getLogoByProvider('officeHours', true)}
                    className={clsx({
                      [s.incomplete]: true,
                    })}
                  />
                )}
              </div>
            </div>
            {showOfficeHours && (
              <div className={s.bottom}>
                <OfficeHoursHandle member={member} userInfo={userInfo} isLoggedIn />
              </div>
            )}
          </div>
        ) : (
          <div className={s.socialPreview}>
            <div className={s.bg1} />
            <div className={s.bg2} />
            <div className={s.top}>
              <div className={s.content}>
                {visibleHandles
                  ?.filter((item) => item !== 'officeHours')
                  .map((item, i, arr) => {
                    return (
                      <Fragment key={item}>
                        <ProfileSocialLink
                          key={item}
                          profile=""
                          height={24}
                          width={24}
                          callback={callback}
                          type={item}
                          handle={consistentRandomString(`${member.name}__${item}`)}
                          logo={getLogoByProvider(item)}
                          isPreview
                        />
                        {i === arr.length - 1 ? null : <div className={s.divider} />}
                      </Fragment>
                    );
                  })}
              </div>
              <div className={clsx(s.control, s.tablet)}>
                <button className={s.loginButton} onClick={onLoginClickHandler}>
                  Login for access
                </button>
              </div>
            </div>
            {showOfficeHours && (
              <div className={s.bottom}>
                <OfficeHoursHandle member={member} userInfo={userInfo} isLoggedIn={false} />
              </div>
            )}
            <div className={clsx(s.control, s.mobileOnly)}>
              <button className={s.loginButton} onClick={onLoginClickHandler}>
                Login for access
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getLogoByProvider(provider: string, isIncomplete?: boolean): string {
  switch (provider) {
    case 'linkedin': {
      return '/icons/contact/linkedIn-contact-logo.svg';
    }
    case 'discord': {
      return '/icons/contact/discord-contact-logo.svg';
    }
    case 'email': {
      return '/icons/contact/email-contact-logo.svg';
    }
    case 'github': {
      return '/icons/contact/github-contact-logo.svg';
    }
    case 'team': {
      return '/icons/contact/team-contact-logo.svg';
    }
    case 'telegram': {
      if (isIncomplete) {
        return '/icons/contact/telegram-contact-logo-orange.svg';
      }
      return '/icons/contact/telegram-contact-logo.svg';
    }
    case 'twitter': {
      return '/icons/contact/twitter-contact-logo.svg';
    }
    case 'officeHours': {
      if (isIncomplete) {
        return '/icons/contact/meet-contact-logo-orange.svg';
      }
      return '/icons/contact/meet-contact-logo.svg';
    }
    default: {
      return '/icons/contact/website-contact-logo.svg';
    }
  }
}

function consistentRandomString(input: string): string {
  const base62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Simple hash to seed a number
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }

  // Expand into 12 base62 characters
  let str = '';
  let seed = hash;
  while (str.length < 8) {
    str += base62[seed % 62];
    seed = (seed * 31 + 17) >>> 0; // mix the seed for next char
  }

  return str;
}

const WarningIcon = () => {
  return (
    <svg width="15" height="13" viewBox="0 0 15 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7.5 0.625C7.88281 0.625 8.23828 0.84375 8.42969 1.17188L14.3359 11.2344C14.5273 11.5898 14.5273 12 14.3359 12.3281C14.1445 12.6836 13.7891 12.875 13.4062 12.875H1.59375C1.18359 12.875 0.828125 12.6836 0.636719 12.3281C0.445312 12 0.445312 11.5898 0.636719 11.2344L6.54297 1.17188C6.73438 0.84375 7.08984 0.625 7.5 0.625ZM7.5 4.125C7.11719 4.125 6.84375 4.42578 6.84375 4.78125V7.84375C6.84375 8.22656 7.11719 8.5 7.5 8.5C7.85547 8.5 8.15625 8.22656 8.15625 7.84375V4.78125C8.15625 4.42578 7.85547 4.125 7.5 4.125ZM8.375 10.25C8.375 9.78516 7.96484 9.375 7.5 9.375C7.00781 9.375 6.625 9.78516 6.625 10.25C6.625 10.7422 7.00781 11.125 7.5 11.125C7.96484 11.125 8.375 10.7422 8.375 10.25Z"
        fill="#0F172A"
      />
    </svg>
  );
};

export default ContactDetails;
