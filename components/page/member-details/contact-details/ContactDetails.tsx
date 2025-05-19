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

interface IContactDetails {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

const PLACEHOLDER = ['twitter', 'telegram', 'github', 'website', 'discord', 'email'];

export const ContactDetails = ({ member, isLoggedIn, userInfo }: IContactDetails) => {
  const router = useRouter();
  const { githubHandle, discordHandle, telegramHandle, twitter, linkedinHandle, email } = member;

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
            {linkedinHandle && (
              <ProfileSocialLink
                callback={callback}
                profile={getProfileFromURL(linkedinHandle, 'linkedin')}
                type="linkedin"
                handle={linkedinHandle}
                logo={'/icons/contact/linkedIn-contact-logo.svg'}
                height={14}
                width={14}
              />
            )}

            {twitter && (
              <ProfileSocialLink
                callback={callback}
                profile={getProfileFromURL(twitter, 'twitter')}
                type="twitter"
                handle={twitter}
                logo={'/icons/contact/twitter-contact-logo.svg'}
                height={14}
                width={14}
              />
            )}

            {discordHandle && (
              <ProfileSocialLink
                callback={callback}
                profile={getProfileFromURL(discordHandle, 'discord')}
                type="discord"
                handle={discordHandle}
                logo={'/icons/contact/discord-contact-logo.svg'}
                height={14}
                width={14}
              />
            )}

            {telegramHandle && (
              <ProfileSocialLink
                callback={callback}
                profile={getProfileFromURL(telegramHandle, 'telegram')}
                type="telegram"
                handle={telegramHandle}
                logo={'/icons/contact/telegram-contact-logo.svg'}
                height={14}
                width={14}
              />
            )}

            {email && (
              <ProfileSocialLink callback={callback} profile={getProfileFromURL(email, 'email')} type="email" handle={email} logo={'/icons/contact/email-contact-logo.svg'} height={14} width={14} />
            )}

            {githubHandle && (
              <ProfileSocialLink
                callback={callback}
                profile={getProfileFromURL(githubHandle, 'github')}
                type="github"
                handle={githubHandle}
                logo={'/icons/contact/github-contact-logo.svg'}
                height={14}
                width={14}
              />
            )}
          </div>
        ) : (
          <div className={s.socialPreview}>
            <div className={s.bg1} />
            <div className={s.bg2} />
            <div className={s.content}>
              {PLACEHOLDER.map((item) => {
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
  while (str.length < 12) {
    str += base62[seed % 62];
    seed = (seed * 31 + 17) >>> 0; // mix the seed for next char
  }

  return str;
}

export default ContactDetails;
