'use client';

import Image from 'next/image';
import Cookies from 'js-cookie';
import { useState } from 'react';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { updateTeam } from '@/services/teams.service';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import { toast } from '@/components/core/ToastContainer';
import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';

import s from './About.module.scss';

interface Props {
  about: string;
  team: ITeam;
  userInfo: IUserInfo | undefined;
  hasTeamEditAccess: boolean;
}

const CONTENT_LENGTH = 347;

export const About = (props: Props) => {
  const { userInfo, team, hasTeamEditAccess } = props;

  const [aboutContent, setAboutContent] = useState(props.about);
  const [aboutEditedContent, setAboutEditedContent] = useState(props.about);
  const [showEditor, setEditor] = useState(false);
  const [about, setAbout] = useState(getContent(props.about));

  const analytics = useTeamAnalytics();

  function getContent(cnt: string) {
    if (cnt.length > CONTENT_LENGTH) {
      return cnt.substring(0, CONTENT_LENGTH) + '...';
    }
    return cnt;
  }

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
    if (aboutEditedContent === '') {
      toast.error('About field cannot be empty');
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

  if (!about) {
    return null;
  }

  return (
    <div className={s.root}>
      <div className={s.header}>
        <h2 className={s.title}>About</h2>
        {!showEditor && hasTeamEditAccess && (
          <button className={s.editBtn} onClick={onEditClickHandler}>
            Edit
          </button>
        )}
        {showEditor && (
          <div className={s.headerActions}>
            <button className={s.cancelBtn} onClick={onCancelClickHandler}>
              <span className={s.cancelBtnTxt}>Cancel</span>
            </button>
            <button className={s.saveBtn} onClick={onSaveClickHandler}>
              <span className={s.saveBtnTxt}>Save</span>
            </button>
          </div>
        )}
      </div>

      {showEditor && (
        <div className={s.content}>
          <RichTextEditor value={aboutEditedContent} onChange={setAboutEditedContent} />
        </div>
      )}

      {!showEditor && (
        <div className={s.content}>
          <div dangerouslySetInnerHTML={{ __html: about }} />
          {aboutContent?.length > about?.length && (
            <span>
              <button className={s.showMoreBtn} onClick={onShowMoreClickHandler}>
                show more
                <span className={s.showMoreIcon}>
                  <Image src="/icons/chevron-up.svg" alt="Edit" height={12} width={12} />
                </span>
              </button>
            </span>
          )}
          {aboutContent?.length > CONTENT_LENGTH && aboutContent === about && (
            <span>
              &nbsp;
              <button className={s.showLessBtn} onClick={onShowLessClickHandler}>
                show less
                <span className={s.showMoreIcon}>
                  <Image src="/icons/showless.svg" alt="Edit" height={12} width={12} />
                </span>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
