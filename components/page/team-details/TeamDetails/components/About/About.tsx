'use client';

import Cookies from 'js-cookie';
import { useState } from 'react';

import { ITeam } from '@/types/teams.types';
import { IUserInfo } from '@/types/shared.types';

import { updateTeam } from '@/services/teams.service';
import { toast } from '@/components/core/ToastContainer';
import { getAnalyticsTeamInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';

import { useTeamAnalytics } from '@/analytics/teams.analytics';

import RichTextEditor from '@/components/ui/RichTextEditor/RichTextEditor';
import { ExpandableDescription } from '@/components/common/ExpandableDescription';

import s from './About.module.scss';

interface Props {
  about: string;
  team: ITeam;
  userInfo: IUserInfo | undefined;
  hasTeamEditAccess: boolean;
}

export const About = (props: Props) => {
  const { userInfo, team, hasTeamEditAccess } = props;

  const [aboutContent, setAboutContent] = useState(props.about);
  const [aboutEditedContent, setAboutEditedContent] = useState(props.about);
  const [showEditor, setEditor] = useState(false);

  const analytics = useTeamAnalytics();

  const onShowMoreClickHandler = () => {
    analytics.onTeamDetailAboutShowMoreClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
  };

  const onShowLessClickHandler = () => {
    analytics.onTeamDetailAboutShowLessClicked(getAnalyticsTeamInfo(team), getAnalyticsUserInfo(userInfo));
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
      toast.success('Team updated successfully');
      analytics.recordAboutSave('save-success', getAnalyticsUserInfo(userInfo), payload);
    }
  };

  if (!aboutContent) {
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
        <ExpandableDescription onShowMore={onShowMoreClickHandler} onShowLess={onShowLessClickHandler}>
          <div className={s.content} dangerouslySetInnerHTML={{ __html: aboutContent }} />
        </ExpandableDescription>
      )}
    </div>
  );
};
