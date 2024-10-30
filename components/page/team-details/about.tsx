'use client';
import { useTeamAnalytics } from '@/analytics/teams.analytics';
import TextEditor from '@/components/ui/text-editor';
import { IUserInfo } from '@/types/shared.types';
import { ITeam } from '@/types/teams.types';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, getParsedValue, triggerLoader } from '@/utils/common.utils';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { updateTeam } from '@/services/teams.service';
import { toast } from 'react-toastify';
interface IAbout {
  about: string;
  team: ITeam;
  userInfo: IUserInfo | undefined;
  hasTeamEditAccess: boolean;
}
const About = (props: IAbout) => {
  const contentLength = 347;
  const [aboutContent, setAboutContent] = useState(props?.about);
  const [aboutEditedContent, setAboutEditedContent] = useState(props?.about);
  const [showEditor, setEditor] = useState(false);
  const userInfo = props?.userInfo;
  const team = props?.team;
  
  const getContent = (cnt:string) => {
    if (cnt.length > contentLength) {
      return cnt.substring(0, contentLength) + '...';
    }
    return cnt;
  }
  
  const [about, setAbout] = useState(getContent(aboutContent));
  const analytics = useTeamAnalytics();

  const onShowMoreClickHandler = () => {
    setAbout(aboutContent);
    analytics.onTeamDetailAboutShowMoreClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const onShowLessClickHandler = () => {
    analytics.onTeamDetailAboutShowLessClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    setAbout(getContent(about));
  };

  const onEditClickHandler = () => {
    setEditor(true);
    analytics.onTeamDetailAboutEditClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const onCancelClickHandler = () => {
    setEditor(false);
    setAboutEditedContent(aboutContent);
    analytics.onTeamDetailAboutEditCancelClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const onSaveClickHandler = async () => {
    if(aboutEditedContent === ''){
      toast.error("About field cannot be empty");
      return;
    }
    setEditor(false);
    analytics.onTeamDetailAboutEditSaveClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
    const authToken = Cookies.get('authToken');
    if (!authToken) {
      return;
    }
    const payload = {
      participantType: 'TEAM',
      referenceUid: team.id,
      uniqueIdentifier: team.name,
      newData: {
        // ...team,
        contactMethod: team.contactMethod,
        name: team.name,
        technologies: team.technologies,
        industryTags: team.industryTags,
        fundingStage: team.fundingStage,
        membershipSources: team.membershipSources,
        logoUid: team.logoUid,
        longDescription: aboutEditedContent,
      },
    };
    triggerLoader(true);
    const { data, isError } = await updateTeam(payload, JSON.parse(authToken), team.id);
    triggerLoader(false);
    if (isError) {
      toast.error('Team updated failed. Something went wrong, please try again later');
      analytics.recordAboutSave('save-error', getAnalyticsUserInfo(userInfo), payload);
    } else {
      setAboutContent(aboutEditedContent);
      setAbout(getContent(aboutEditedContent));
      toast.success('Team updated successfully');
      analytics.recordAboutSave('save-success', getAnalyticsUserInfo(userInfo), payload);
    }
  };
  return (
    <>
      {about && (
        <div className="about">
          <div className="about__header">
            <h2 className="about__header__title">About</h2>
            {!showEditor && props?.hasTeamEditAccess && (
              <button className="about__header__edit" onClick={onEditClickHandler}>
                Edit
                {/* <Image src="/icons/edit.svg" alt="Edit" height={16} width={16} /> */}
              </button>
            )}
            {showEditor && (
              <div className="about__header__action">
                <button className="about__header__action__cancel" onClick={onCancelClickHandler}>
                  <span className="about__header__action__cancel__txt">Cancel</span>
                </button>
                <button className="about__header__action__save" onClick={onSaveClickHandler}>
                  <span className="about__header__action__save__txt">Save</span>
                </button>
              </div>
            )}
          </div>
          {showEditor && (
            <div className="about__content">
              <TextEditor text={aboutEditedContent} setContent={setAboutEditedContent} />
            </div>
          )}
          {!showEditor && (
            <div className="about__content">
              <div dangerouslySetInnerHTML={{ __html: about }} />
              {aboutContent?.length > about?.length && (
                <span>
                  <button className="about__content__show-more" onClick={onShowMoreClickHandler}>
                    show more
                    <span className="about__content__show-more__icon">
                      <Image src="/icons/chevron-up.svg" alt="Edit" height={12} width={12} />
                    </span>
                  </button>
                </span>
              )}
              {aboutContent?.length > contentLength && aboutContent === about && (
                <span>
                  &nbsp;
                  <button className="about__content__show-less" onClick={onShowLessClickHandler}>
                    show less
                    <span className="about__content__show-more__icon">
                      <Image src="/icons/showless.svg" alt="Edit" height={12} width={12} />
                    </span>
                  </button>
                </span>
              )}
            </div>
          )}
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

          .about__header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .about__header__title {
            color: #64748b;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
          }

          .about__header__edit {
            display: flex;
            font-size: 14px;
            font-weight: 500;
            color: #156ff7;
            align-items: center;
            height: fit-content;
            background: none;
            border: none;
            white-space: nowrap;
            gap: 8px;
          }

          .about__content__show-more__icon {
            top: 2px;
            position: relative;
            width: 12px;
            height: 12px;
            display: inline-block;
            margin-left: 4px;
          }

          .about__content {
            color: #0f172a;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
            overflow: hidden;
            position: relative;
            // word-wrap: break-word; /* Allow long words to be broken and wrapped */
            // word-break: break-all;
          }

          .about__content__show-more {
            color: #156ff7;
            padding: 0;
            border: none;
            background-color: #fff;
            font-size: 14px;
            font-weight: 500;
            line-height: 14px;
            // float: right;
          }

          .about__content__show-less {
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            line-height: 14px;
            padding: 0;
            border: none;
            background-color: #fff;
            // float: right;
          }

          .about__header__action__cancel {
            padding: 8px 16px;
            background: white;
            border: 1px solid #156ff7;
            border-radius: 8px;
          }

          .about__header__action__cancel__txt {
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            text-align: left;
            color: #156ff7;
          }

          .about__header__action__save {
            padding: 8px 16px;
            background: white;
            border: 1px solid #156ff7;
            border-radius: 8px;
            background: #156ff7;
          }

          .about__header__action__save__txt {
            font-size: 15px;
            font-weight: 600;
            line-height: 24px;
            text-align: left;
            color: white;
          }
          .about__header__action {
            display: flex;
            gap: 8px;
          }
        `}
      </style>
    </>
  );
};

export default About;
