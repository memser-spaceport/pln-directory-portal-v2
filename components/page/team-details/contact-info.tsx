"use client";

import { IUserInfo } from "@/types/shared.types";
import { ITeam } from "@/types/teams.types";
import ContactMethod from "./contact-method";
import { ProfileSocialLink } from "./profile-social-link";
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, getProfileFromURL } from "@/utils/common.utils";
import { useTeamAnalytics } from "@/analytics/teams.analytics";

interface IContactInfo {
  team: ITeam | undefined;
  userInfo: IUserInfo | undefined;
}
const ContactInfo = (props: IContactInfo) => {
  const team = props?.team;
  const userInfo = props?.userInfo;
  const website =  team?.website;
  const twitter = team?.twitter;
  const contactMethod = team?.contactMethod;
  const linkedinHandle = team?.linkedinHandle;

  const analytics = useTeamAnalytics();

  const callback = (type: string, url: string) => {
    analytics.onTeamDetailContactClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo), type, url);
  }

  return (
    <>
      <div className="contact-info-container">
        <h2 className="contact-info-container__title">Contact Details</h2>
        <div className="contact-info-container__contacts">
          {/* Preferred contact */}
          {contactMethod && (
            <div className="contact-info-container__links">
              <ContactMethod callback={callback} contactMethod={contactMethod} />
            </div>
          )}
          {/* Website */}
          {website && <ProfileSocialLink callback={callback} profile={getProfileFromURL(website, "website")} type="website" handle={website} logo={"/icons/contact/website-contact-logo.svg"} height={14} width={14} />}
          {/* Twitter */}
          {twitter && <ProfileSocialLink callback={callback} profile={getProfileFromURL(twitter, "twitter")} handle={twitter} type="twitter" logo={"/icons/contact/twitter-contact-logo.svg"} height={14} width={14} />}
          {/* Linked-In */}
          {linkedinHandle && (
            <ProfileSocialLink callback={callback} profile={getProfileFromURL(linkedinHandle, "linkedin")}  handle={linkedinHandle} type="linkedin" logo={"/icons/contact/linkedIn-contact-logo.svg"} height={14} width={14} />
          )}
        </div>
      </div>

      <style jsx>
        {`
            .contact-info-container {
                padding: 20px 20px 20px 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                background: #fff;
                border-radius: 8px;
                background: #FFF;
            }

            .contact-info-container {
                
            }

            .contact-info-container__title {
                color: #64748B;
                font-size: 14px;
                font-weight: 500;
                line-height: 20px;
            }

            .contact-info-container__contacts {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .`}
      </style>
    </>
  );
};

export default ContactInfo;
