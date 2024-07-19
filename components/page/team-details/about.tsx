'use client'
import { useTeamAnalytics } from "@/analytics/teams.analytics";
import { IUserInfo } from "@/types/shared.types";
import { ITeam } from "@/types/teams.types";
import { getAnalyticsTeamInfo, getAnalyticsUserInfo } from "@/utils/common.utils";
import { useState } from "react";

interface IAbout {
  about: string;
  team: ITeam;
  userInfo : IUserInfo | undefined
}
const About = (props: IAbout) => {
  const aboutContent = props?.about;
  const [about, setAbout] = useState(aboutContent.substring(0, 350));
  const userInfo = props?.userInfo;
  const team = props?.team;

  const analytics = useTeamAnalytics();

  const onShowMoreClickHandler = () => {
    setAbout(aboutContent);
    analytics.onTeamDetailAboutShowMoreClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const onShowLessClickHandler = () => {
    analytics.onTeamDetailAboutShowLessClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    setAbout(about?.substring(0, 350));
  };
  return (
    <>
      {about && (
        <div className="about">
          <h2 className="about__title">About</h2>
          <div className="about__content">
            <span dangerouslySetInnerHTML={{__html: about}}/>
            {aboutContent?.length > about?.length && (
              <span>
                ...
                <button className="about__content__show-more" onClick={onShowMoreClickHandler}>
                  Show more
                </button>
              </span>
            )}
            {aboutContent?.length > 350 && aboutContent === about && (
              <span>
                &nbsp;
                <button className="about__content__show-less" onClick={onShowLessClickHandler}>
                  Show less
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      <style jsx>
        {`
          .about {
            display: flex;
          }

          .about {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .about__title {
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .about__content {
            color: #0f172a;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }

          .about__content__show-more {
            color: #156ff7;
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            padding: 0;
            border: none;
            background-color: #fff;
          }

          .about__content__show-less {
            color: #156ff7;
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            padding: 0;
            border: none;
            background-color: #fff;
          }
        `}
      </style>
    </>
  );
};

export default About;
