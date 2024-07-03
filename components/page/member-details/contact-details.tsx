'use client';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { ProfileSocialLink } from './profile-social-link';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, getProfileFromURL } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import { LEARN_MORE_URL } from '@/utils/constants';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useAuthAnalytics } from '@/analytics/auth.analytics';

interface IContactDetails {
  member: IMember;
  isLoggedIn: boolean;
  userInfo: IUserInfo;
}

const ContactDetails = (props: IContactDetails) => {
  const member = props?.member;

  const githubHandle = member?.githubHandle;
  const discordHandle = member?.discordHandle;
  const telegramHandle = member?.telegramHandle;
  const twitter = member?.twitter;
  const linkedinHandle = member?.linkedinHandle;
  const email = member?.email;

  const isLoggedIn = props?.isLoggedIn;
  const officeHours = member?.officeHours;

  const userInfo = props?.userInfo;
  const router = useRouter();

  const authAnalytics = useAuthAnalytics();
  const memberAnalytics = useMemberAnalytics();

  const callback = (type: string, url: string) => {
    memberAnalytics.onSocialProfileLinkClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member), type, url);
  };

  const onLoginClickHandler = () => {
    authAnalytics.onLoginBtnClicked();
    router.push(`${window.location.pathname}${window.location.search}#login`);
  };

  const onScheduleMeeting = () => {
    memberAnalytics.onOfficeHourClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
  };

  const onLearnMoreBtnClick = ()=> {
    memberAnalytics.onLearnMoreClicked(getAnalyticsUserInfo(userInfo),  getAnalyticsMemberInfo(member))
  }

  return (
    <>
      <div className="contact-details">
        <h2 className="contact-details__title">ContactDetails</h2>
        <div className="contact-details__container">
          {isLoggedIn && (
            <div className="contact-details__container__social">
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
              {linkedinHandle && (
                <ProfileSocialLink
                  callback={callback}
                  profile={getProfileFromURL(linkedinHandle, 'linkedin')}
                  type="linkedin"
                  handle={linkedinHandle}
                  logo={'/icons/contact/linkedin-contact-logo.svg'}
                  height={14}
                  width={14}
                />
              )}
              {email && (
                <ProfileSocialLink callback={callback} profile={getProfileFromURL(email, 'email')} type="email" handle={email} logo={'/icons/contact/email-contact-logo.svg'} height={14} width={14} />
              )}
            </div>
          )}

          <div className="contact-details__container__office-hours">
            <div className="contact-details__container__office-hours__left">
              <div className="contact-details__container__office-hours__left__calendar">
                <img loading="lazy" alt="calendar" className="contact-details__container__office-hours__left__calendar__icon" src="/icons/calendar.svg" />
              </div>
              <h2 className="contact-details__container__office-hours__left__calendar__title">Office Hours</h2>
            </div>
            <div className="contact-details__container__office-hours__right">
              <a href={LEARN_MORE_URL} target="blank">
                <button onClick={onLearnMoreBtnClick} className="contact-details__container__office-hours__right__learn-more">
                  Learn more
                  <img loading="lazy" alt="learn more" src="/icons/learn-more.svg" height={16} width={16} />
                </button>
              </a>
              {isLoggedIn && officeHours && (
                <a href={officeHours} target="blank" onClick={onScheduleMeeting}>
                  <button className="contact-details__container__office-hours__right__meeting">Schedule Meeting</button>
                </a>
              )}

              {isLoggedIn && !officeHours && (
                <button disabled className="contact-details__container__office-hours__right__meeting cursor-default">
                  Not Available
                </button>
              )}

              {!isLoggedIn && (
                <button onClick={onLoginClickHandler} className="contact-details__container__office-hours__right__meeting">
                  Login to Schedule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>
        {`
          .contact-details {
          }

          .contact-details__title {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            letter-spacing: 0px;
            text-align: left;
            color: #64748b;
          }

          .contact-details__container {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .contact-details__container__social {
            margin-top: 8px;
            display: flex;
            flex-wrap: wrap;
            width: 100%;
            gap: 8px;
          }

          .contact-details__container__office-hours {
            padding: 16px;
            display: flex;
            flex-wrap: wrap;
            background: #f8fafc;
            border-radius: 12px;
            gap: 8px;
            margin-top: 8px;
            align-items: center;
            justify-content: space-between;
          }

          .contact-details__container__office-hours__left {
            display: flex;
            gap: 16px;
          }

          .contact-details__container__office-hours__right {
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .contact-details__container__office-hours__left__calendar__icon {
            padding: 4px;
            display: flex;
            align-items: center;
            background: #dbeafe;
            border-radius: 4px;
          }

          .contact-details__container__office-hours__right__learn-more {
            border: none;
            background: inherit;
            color: #000;
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
            letter-spacing: 0px;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .contact-details__container__office-hours__right__meeting {
            background: #fff;
            color: #000;
            box-shadow: 0px 1px 1px 0px #0f172a14;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 500;
            color: #000;
            line-height: 20px;
            letter-spacing: 0px;
            text-align: left;
          }

          .contact-details__container__office-hours__left__calendar__title {
            font-size: 18px;
            font-weight: 600;
            line-height: 28px;
            letter-spacing: 0.01em;
            text-align: left;
            color: #000;
          }
          .cursor-default {
            cursor: default;
          }
        `}
      </style>
    </>
  );
};

export default ContactDetails;
