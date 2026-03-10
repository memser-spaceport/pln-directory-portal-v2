'use client';

import { ProfileSocialLink } from '../profile-social-link';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, getProfileFromURL } from '@/utils/common.utils';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';

import s from './ContactDetails.module.scss';
import Cookies from 'js-cookie';
import { toast } from '@/components/core/ToastContainer';
import { TOAST_MESSAGES } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useAuthAnalytics } from '@/analytics/auth.analytics';

import React, { Fragment } from 'react';
import { clsx } from 'clsx';
import { EditButton } from '@/components/common/profile/EditButton';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { getAccessLevel } from '@/utils/auth.utils';
import { DataIncomplete } from '@/components/page/member-details/DataIncomplete';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { Divider } from '@/components/common/profile/Divider';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

type ContactDetailsVariant = 'default' | 'drawer';

interface Props {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
  onEdit: () => void;
  variant?: ContactDetailsVariant;
}

const SOCIAL_TO_HANDLE_MAP: Record<string, string> = {
  linkedin: 'linkedinHandle',
  github: 'githubHandle',
  twitter: 'twitter',
  email: 'email',
  discord: 'discordHandle',
  telegram: 'telegramHandle',
};

const VISIBLE_HANDLES = ['email', 'linkedin', 'telegram', 'twitter', 'discord', 'github'];
const DRAWER_HANDLES = ['email', 'linkedin', 'telegram', 'twitter'];

export const ContactDetails = ({ member, isLoggedIn, userInfo, onEdit, variant = 'default' }: Props) => {
  const router = useRouter();
  const { visibleHandles } = member;
  const isAdmin = isAdminUser(userInfo);
  const isOwner = userInfo?.uid === member.id;
  const hasMissingRequiredData = !member?.linkedinHandle;
  const authAnalytics = useAuthAnalytics();
  const memberAnalytics = useMemberAnalytics();
  const isDrawer = variant === 'drawer';
  const showIncomplete = hasMissingRequiredData && isOwner;
  const accessLevel = getAccessLevel(userInfo, isLoggedIn);

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
    memberAnalytics.onSocialProfileLinkClicked(
      getAnalyticsUserInfo(userInfo),
      getAnalyticsMemberInfo(member),
      type,
      url,
    );
  };

  return (
    <div
      className={clsx(s.root, {
        [s.missingData]: showIncomplete && isLoggedIn && isOwner,
      })}
    >
      {showIncomplete && (
        <DataIncomplete className={s.incompleteStrip}>
          Complete your profile by adding contact details — make it easier for others to connect with you
        </DataIncomplete>
      )}
      <div className={s.contentRoot}>
        <DetailsSectionHeader title="Contact Details">
          {isLoggedIn && (isAdmin || isOwner) && <EditButton onClick={onEdit} />}
        </DetailsSectionHeader>
        <div className={s.container}>
          {isDrawer || (isLoggedIn && (accessLevel === 'advanced' || isOwner)) ? (
            <div className={s.social}>
              <div className={s.top}>
                <div className={s.content}>
                  {(isDrawer ? DRAWER_HANDLES : VISIBLE_HANDLES)
                    ?.map((item) => {
                      const handle = (member as unknown as Record<string, string>)[SOCIAL_TO_HANDLE_MAP[item]];

                      if (isDrawer && item === 'linkedin' && !handle) {
                        return {
                          completed: false,
                          content: (
                            <Fragment key={item}>
                              <button type="button" className={s.addLinkedinButton} onClick={onEdit}>
                                <AddIcon />
                                <span>Add LinkedIn</span>
                              </button>
                              <Divider />
                            </Fragment>
                          ),
                        };
                      }

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
                              logo={getContactLogoByProvider(item)}
                              className={clsx({
                                [s.incomplete]: !handle,
                                [s.grayscale]: !handle && isDrawer,
                              })}
                            />
                            <Divider />
                          </Fragment>
                        ),
                      };
                    })
                    .map((item) => item.content)}
                </div>
              </div>
            </div>
          ) : (
            <div className={s.socialPreview}>
              <div className={s.bg1} />
              <div className={s.bg2} />
              <div className={s.top}>
                <div className={s.content}>
                  {visibleHandles?.map((item, i, arr) => {
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
                          logo={getContactLogoByProvider(item)}
                          isPreview
                        />
                        {i === arr.length - 1 ? null : <Divider />}
                      </Fragment>
                    );
                  })}
                </div>
                <div className={clsx(s.control, s.tablet)}>
                  {!isLoggedIn && (
                    <button className={s.loginButton} onClick={onLoginClickHandler}>
                      Login for access
                    </button>
                  )}
                </div>
              </div>
              <div className={clsx(s.control, s.mobileOnly)}>
                {!isLoggedIn && (
                  <button className={s.loginButton} onClick={onLoginClickHandler}>
                    Login for access
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AddIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 3.5V12.5M3.5 8H12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
