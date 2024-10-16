'use client';

import { useProjectAnalytics } from '@/analytics/project.analytics';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import { deleteProject } from '@/services/projects.service';
import { IUserInfo } from '@/types/shared.types';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import DeleteConfirmationModal from './delete-confirmation-modal';
import { useEffect } from 'react';

interface IHeader {
  project: any;
  userHasDeleteRights: boolean;
  userHasEditRights: boolean;
  user: IUserInfo;
  authToken: string;
}

const Header = (props: IHeader) => {
  const project = props?.project;
  const name = project?.name ?? '';
  const tagline = project?.tagline ?? '';
  const lookingForFunding = project?.lookingForFunding ?? false;
  const userHasDeleteRights = props?.userHasDeleteRights ?? false;
  const userHasEditRights = props?.userHasEditRights ?? false;
  const id = project?.id ?? '';
  const isDeleted = project?.isDeleted ?? false;
  const user = props?.user;
  const authToken = props?.authToken;
  const router = useRouter();

  const analytics = useProjectAnalytics();

  const onOpenDeleteModal = () => {
    analytics.onProjectDeleteBtnClicked(getAnalyticsUserInfo(user), id);
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_DELETE_MODAL_OPEN_AND_CLOSE, { detail: true }));
  };

  const onCloseModal = () => {
    analytics.onProjectDeleteCancelBtnClicked(getAnalyticsUserInfo(user), id);
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_DELETE_MODAL_OPEN_AND_CLOSE, { detail: false }));
  };

  const onEditProject = () => {
    analytics.onProjectDetailEditClicked(getAnalyticsUserInfo(user), id);
    router.push(`/projects/update/${id}`);
  };

  const onDeleteProject = async () => {
    analytics.onProjectDeleteConfirmBtnClicked(getAnalyticsUserInfo(user), id);
    triggerLoader(true);
    try {
      const res = await deleteProject(id, authToken);
      if (res.status === 200) {
        triggerLoader(false);
        analytics.onProjectDeleteSuccess(getAnalyticsUserInfo(user), id);
        toast.success('Project deleted successfully.');
        document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_DELETE_MODAL_OPEN_AND_CLOSE, { detail: false }));
        router.push('/projects');
        router.refresh();
      } else {
        triggerLoader(false);
      }
    } catch (err) {
      triggerLoader(false);
      analytics.onProjectDeleteFailed(getAnalyticsUserInfo(user), id);
      document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_DELETE_MODAL_OPEN_AND_CLOSE, { detail: false }));
      console.error(err);
    }
  };

  useEffect(() => {
    triggerLoader(false);
  }, [router]);

  return (
    <>
      <div className="header">
        <div className="header__profile">
          <img fetchPriority="high" className="header__profile__img" src={project?.logo ?? '/icons/default-project.svg'} alt="logo" />
        </div>
        <div className="header__details">
          <div className="header__details__specifics">
            <div className="header__details__specifics__hdr">
              <Tooltip asChild content={name} trigger={<h1 className="header__details__specifics__name">{name}</h1>} />
            </div>
            <p className="header__details__specifics__desc">{tagline}</p>
          </div>
          <div className="header__details__controls">
            {/* <button className="header__details__controls__notice__button">
              <img src="/icons/notification.svg" alt="notification icon" />
            </button> */}
            {!isDeleted && (
              <>
                {userHasEditRights && (
                  <button className="header__details__controls__edit" onClick={onEditProject}>
                    <img width={14} height={14} src="/icons/edit-blue.svg" alt="edit icon" />
                    <p>Edit</p>
                  </button>
                )}
                {userHasDeleteRights && (
                  <button onClick={onOpenDeleteModal} className="header__details__controls__delete">
                    <img width={14} height={14} src="/icons/delete.svg" alt="delete icon" />
                    <p>Delete</p>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="header__tags">
          {lookingForFunding && (
            <div className="header__tags__funds">
              <img src="/icons/moneybag.svg" alt="icon" />
              <span className="header__tags__funds__text">Raising Funds</span>
            </div>
          )}
        </div>
      </div>
      <DeleteConfirmationModal onClose={onCloseModal} onDeleteProject={onDeleteProject} />
      <style jsx>{`
        .header {
          display: grid;
          grid-template-columns: 48px auto;
          column-gap: 8px;
        }

        button {
          background: none;
          outline: none;
          cursor: pointer;
        }

        .header__profile {
          grid-row: span 2 / span 2;
        }

        .header__profile__img {
          width: 48px;
          height: 48px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
        }

        .header__details {
          display: flex;
          gap: 10px;
          justify-content: space-between;
          grid-row: span 2 / span 2;
          grid-column: span 4 / span 4;
          margin-bottom: 16px;
        }

        .header__details__specifics__hdr {
          height: 23px;
          display: flex;
          align-items: center;
        }

        .header__details__specifics__name {
          font-size: 16px;
          font-weight: 700;
          line-height: 16px;
          letter-spacing: 0em;
          color: #0f172a;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          max-width: 200px;
        }

        .header__details__specifics__desc {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          letter-spacing: 0px;
          color: #0f172a;
          word-break: break-word;
        }

        .header__details__controls {
          display: flex;
          gap: 16px;
          align-items: self-start;
        }

        .header__details__controls__notice__button {
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header__tags {
          grid-row: span 1 / span 1;
          grid-column: span 5 / span 5;
          padding-top: ${lookingForFunding ? '24px' : '0px'};
          border-top: 1px solid #e2e8f0;
        }

        .header__tags__funds__text {
          font-size: 12px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0px;
          color: #475569;
        }

        .header__tags__funds {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background-color: #f1f5f9;
          border-radius: 56px;
          padding: 1px 8px 1px 0px;
        }

        .header__details__controls__edit {
          color: #156ff7;
          font-size: 15px;
          font-weight: 500;
          line-height: 24px;
          letter-spacing: 0em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .header__details__controls__delete {
          color: #ff6038;
          font-size: 15px;
          font-weight: 500;
          line-height: 24px;
          letter-spacing: 0em;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .header__details__controls__edit span,
        .header__details__controls__delete span {
          display: none;
        }

        @media (min-width: 1024px) {
          .header {
            grid-template-columns: 80px auto;
            column-gap: 24px;
          }

          .header__details__specifics__hdr {
          height: 40px;}

          .header__profile {
            grid-row: span 3 / span 3;
          }

          .header__profile__img {
            height: 80px;
            width: 80px;
          }

          .header__details {
            grid-row: span 2 / span 2;
            grid-column: 2 / auto;
            margin-bottom: unset;
          }

          .header__tags {
            grid-row: span 1 / span 1;
            grid-column: 2 / auto;
            border-top: unset;
            padding: 16px 0px 0px 0px;
          }

          .header__details__controls__edit span,
          .header__details__controls__delete span {
            display: block;
          }
        }
      `}</style>
    </>
  );
};

export default Header;
