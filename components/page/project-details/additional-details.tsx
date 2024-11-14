'use client';

import { useProjectAnalytics } from '@/analytics/project.analytics';
import { updateProject } from '@/services/projects.service';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import 'md-editor-rt/lib/style.css';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'react-toastify';

const MdEditor = dynamic(() => import('md-editor-rt').then((mod) => mod.MdEditor));
const MdPreview = dynamic(() => import('md-editor-rt').then((mod) => mod.MdPreview));

/**
 * Interface for Additional Details component
 * @interface
 * @property {any} project - project details
 * @property {boolean} userHasEditRights - user has edit rights
 * @property {string} authToken - auth token
 * @property {IUserInfo | null} user - user info
 * @name IAdditionalDetails
 *
 */
interface IAdditionalDetails {
  project: any;
  userHasEditRights: boolean;
  authToken: string;
  user: IUserInfo | null;
}

/**
 *  Additional Details component to showcase extra details of the project
 * @param props  - project, userHasEditRights, authToken, user
 * @returns   - Additional Details component
 * @component   - AdditionalDetails
 * @example
 * const project = {
 *  id: '123',
 *  readMe: 'This is a sample readme',
 *  isDeleted: false,
 *  maintainingTeam: {
 *    uid: '123',
 *  }
 * }
 * const user = {
 *  leadingTeams: ['123']
 * }
 * const authToken = XYZ
 * const userHasEditRights = true
 * return (
 * <AdditionalDetails project={project} userHasEditRights={userHasEditRights} authToken={authToken} user={user} />
 * )
 */
export const AdditionalDetails = (props: IAdditionalDetails) => {
  const project = props?.project;
  const isDeleted = project?.isDeleted ?? false;
  const userHasEditRights = props?.userHasEditRights;
  const initialReadme = project?.readMe;
  const authToken = props?.authToken;
  const userInfo = props?.user;

  const isTeamOftheProject = getIsTeamOfTheProject();

  const analytics = useProjectAnalytics();

  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [text, setText] = useState(initialReadme);

  function getIsTeamOfTheProject() {
    try {
      if (userInfo?.leadingTeams) {
        return userInfo?.leadingTeams?.includes(project.maintainingTeam?.uid);
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  const onEditAction = () => {
    analytics.onProjectDetailEditReadMeClicked(getAnalyticsUserInfo(userInfo), project?.id, "project-details");
    setIsEditorVisible(true);
  };

  const onCancelAction = () => {
    analytics.onProjectDetailAdditionalDetailEditCanceled(getAnalyticsUserInfo(userInfo), project?.uid);
    setText(initialReadme);
    setIsEditorVisible(false);
  };

  const onSaveAction = async () => {
    triggerLoader(true);
    analytics.onProjectDetailReadMeEditSaveBtnClicked(getAnalyticsUserInfo(userInfo), project?.id);
    try {
      const res = await updateProject(project?.uid, { readMe: text }, authToken);
      if (res.status === 200 || res.status === 201) {
        triggerLoader(false);
        toast.success('Additional Details updated successfully.');
        analytics.onProjectDetailReadMeEditSuccess(getAnalyticsUserInfo(userInfo), project?.id);
      }
    } catch (er) {
      triggerLoader(false);
      analytics.onProjectDetailReadMeEditFailed(getAnalyticsUserInfo(userInfo), project?.id);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      triggerLoader(false);
    }
    setIsEditorVisible(false);
  };

  return (
    <>
      <div className="addDetails">
        <div className="addDetails__hdr">
          <h6 className="addDetails__hdr__title">Additional Details</h6>
          {!isDeleted && userHasEditRights && !isEditorVisible && initialReadme && (
            <button className="addDetails__hdr__edit" onClick={onEditAction}>
              Edit
            </button>
          )}
          {isEditorVisible && (
            <div className="addDetails__hdr__actions">
              <button className="addDetails__hdr__actions__save" onClick={onSaveAction}>
                Save
              </button>
              <button className="addDetails__hdr__actions__cancel" onClick={onCancelAction}>
                Cancel
              </button>
            </div>
          )}
        </div>
        {!isEditorVisible && !initialReadme && (
          <div className="addDetails__preview__nodetails">
            No additional details added.
            {isTeamOftheProject && (
              <span>
                <span className="addDetails__preview__nodetails__text" onClick={onEditAction}>
                  {' '}
                  Click Here{' '}
                </span>
                to add additional details (markdown supported).
              </span>
            )}
          </div>
        )}
        <div className="addDetails__preview">{!isEditorVisible && initialReadme && <MdPreview className="addDetails__preview__editor" modelValue={text} />}</div>
        {isEditorVisible && (
          <div>
            <MdEditor modelValue={text} onChange={setText} language={'en-US'} toolbarsExclude={['catalog', 'github', 'save', 'htmlPreview']} />
          </div>
        )}
      </div>
      <style jsx>{`
        button {
          background-color: inherit;
        }
        .addDetails {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .addDetails__hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .addDetails__hdr__title {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #64748b;
        }

        .addDetails__hdr__edit,
        .addDetails__hdr__actions__save,
        .addDetails__hdr__actions__cancel {
          font-size: 15px;
          line-height: 24px;
          color: #156ff7;
          font-weight: 500;
        }

        .addDetails__hdr__actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .addDetails__preview {
          all: revert;
        }

        .addDetails__preview__nodetails {
          border-width: 1px;
          border-radius: 12px;
          padding: 16px 16px 16px 0px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.12px;
          color: #0f172a;
        }

        .addDetails__preview__nodetails__text {
          color: #156ff7;
          cursor: pointer;
        }
      `}</style>
    </>
  );
};
