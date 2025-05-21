'use client';
import { ProfileSocialLink } from '../profile-social-link';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, getProfileFromURL } from '@/utils/common.utils';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';

import s from './ContactDetails.module.scss';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { TOAST_MESSAGES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useAuthAnalytics } from '@/analytics/auth.analytics';
import { OfficeHoursHandle } from '@/components/page/member-details/office-hours-handle';
import { Fragment } from 'react';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

const SOCIAL_TO_HANDLE_MAP: Record<string, string> = {
  linkedin: 'linkedinHandle',
  github: 'githubHandle',
  twitter: 'twitter',
  email: 'email',
  discord: 'discordHandle',
  telegram: 'telegramHandle',
};

export const ContactDetails = ({ member, isLoggedIn, userInfo }: Props) => {
  const router = useRouter();
  const { visibleHandles } = member;

  const showOfficeHours = visibleHandles?.includes('officeHours');

  const authAnalytics = useAuthAnalytics();
  const memberAnalytics = useMemberAnalytics();

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
    <div className={s.root}>
      <h2 className={s.title}>Contact Details</h2>
      <div className={s.container}>
        {isLoggedIn ? (
          <div className={s.social}>
            {visibleHandles
              ?.filter((item) => item !== 'officeHours')
              .map((item, i, arr) => {
                const handle = (member as unknown as Record<string, string>)[SOCIAL_TO_HANDLE_MAP[item]];

                return (
                  <Fragment key={item}>
                    <ProfileSocialLink profile={getProfileFromURL(handle, item)} height={24} width={24} callback={callback} type={item} handle={handle} logo={getLogoByProvider(item)} />
                    {!showOfficeHours && i === arr.length - 1 ? null : <div className={s.divider} />}
                  </Fragment>
                );
              })}
            {visibleHandles?.includes('officeHours') && <OfficeHoursHandle member={member} userInfo={userInfo} />}
          </div>
        ) : (
          <div className={s.socialPreview}>
            <div className={s.bg1} />
            <div className={s.bg2} />
            <div className={s.content}>
              {visibleHandles?.map((item) => {
                return (
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
                );
              })}
            </div>
            <div className={s.control}>
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

function getLogoByProvider(provider: string): string {
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
      return '/icons/contact/telegram-contact-logo.svg';
    }
    case 'twitter': {
      return '/icons/contact/twitter-contact-logo.svg';
    }
    case 'officeHours': {
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
