'use client';
import { ProfileSocialLink } from './profile-social-link';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, getProfileFromURL } from '@/utils/common.utils';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';
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
  const userInfo = props?.userInfo;

  const memberAnalytics = useMemberAnalytics();

  const callback = (type: string, url: string) => {
    memberAnalytics.onSocialProfileLinkClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member), type, url);
  };

  return (
    <>
      <div className="contact-details">
        <h2 className="contact-details__title">Contact Details</h2>
        <div className="contact-details__container">
          <div className="contact-details__container__social">
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
        </div>
      </div>
      <style jsx>
        {`
          .contact-details {
          padding:20px 20px 0px 20px;
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
        `}
      </style>
    </>
  );
};

export default ContactDetails;
