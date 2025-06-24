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
        [s.missingData]: showIncomplete && isLoggedIn && isOwner,
      })}
    >
      {/*{showIncomplete && (*/}
      {/*  <div className={s.missingDataHeader}>*/}
      {/*    <WarningIcon />*/}
      {/*    Please complete your profile to get full access to the platform.*/}
      {/*  </div>*/}
      {/*)}*/}
      <div className={s.header}>
        <h2 className={s.title}>Contact Details</h2>
        {isLoggedIn && (isAdmin || isOwner) && <EditButton onClick={onEdit} incomplete={showIncomplete} />}
      </div>
      <div className={s.container}>
        {isLoggedIn ? (
          <div className={s.social}>
            <div className={s.top}>
              <div className={s.content}>
                {VISIBLE_HANDLES?.map((item) => {
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
                        <div className={s.divider} />
                      </Fragment>
                    ),
                  };
                })
                  .sort((a) => (a.completed ? -1 : 1))
                  .map((item) => item.content)}
                {!member?.officeHours && (
                  <ProfileSocialLink
                    profile=""
                    height={24}
                    width={24}
                    callback={callback}
                    type=""
                    handle=""
                    logo={getLogoByProvider('officeHours', false)}
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

export default ContactDetails;
