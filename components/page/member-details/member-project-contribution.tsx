'use client';

import { Fragment, useRef, useState } from 'react';
import MemberEmptyProjectExperience from './member-empty-project-experienct';
import MemberProjectExperienceCard from './member-project-experience-card';
import { ADMIN_ROLE, PAGE_ROUTES } from '@/utils/constants';
import MemberProjectContributions from './member-project-contributions';
import Modal from '@/components/core/modal';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useRouter } from 'next/navigation';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import dynamic from 'next/dynamic';

dynamic(() => import('@/components/core/modal'), { ssr: false });

interface IMemberProjectExperience {
  member: any;
  userInfo: any;
}

const MemberProjectContribution = (props: IMemberProjectExperience) => {
  const member = props?.member;
  const userInfo = props?.userInfo;
  const allContributions: any = member?.projectContributions ?? [];
  const presentContributions = [...allContributions].filter((v) => v.endDate === null).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const pastContributions = [...allContributions].filter((v) => v.endDate !== null).sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  const contributions = [...presentContributions, ...pastContributions];
  const isOwner = userInfo?.uid == member?.id;
  const isAdmin = userInfo?.uid === member?.id || (userInfo?.roles?.length > 0 && userInfo?.roles?.includes(ADMIN_ROLE));

  // const analytics = useMemberDetailAnalytics();
  const modalRef = useRef<HTMLDialogElement>(null);
  const analytics = useMemberAnalytics();
  const router = useRouter();

  const onClose = () => {
    if (modalRef.current) {
      document.dispatchEvent(new CustomEvent('close-member-projects-modal'));
      modalRef.current.close();
    }
  };

  const onSeeAllClickHandler = () => {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
    analytics.onSeeAllProjectContributionsClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member));
  };

  const onEditOrAdd = () => {
    analytics.onProjectContributionEditClicked(member);
    if (isAdmin && !isOwner) {
      router.push(`${PAGE_ROUTES.SETTINGS}/members?id=${member?.id}`);
    } else {
      router.push(`${PAGE_ROUTES.SETTINGS}/profile`);
    }
  };

  return (
    <>
      <div className="member-project-experience">
        <div className="member-project-experience__header">
          <h2 className="member-project-experience__title">Project Contributions {contributions && Array.isArray(contributions) ? `(${contributions?.length})` : ''}</h2>
          <div className="member-project-experience__header__options">
            {(isOwner || isAdmin) && (
              <button onClick={onEditOrAdd} className="member-project-experience__header__edit-btn">
                Add/Edit
              </button>
            )}
            {contributions?.length > 3 && (
              <button className="member-project-experience__header__seeall-btn" onClick={onSeeAllClickHandler}>
                See all
              </button>
            )}
          </div>
        </div>
        {contributions?.length == 0 && (
          <div className="member-project-experience__empty-repo">
            <MemberEmptyProjectExperience profileType="member" member={member} userInfo={userInfo} />
          </div>
        )}

        {contributions && Array.isArray(contributions) && contributions?.length > 0 && (
          <div className="member-project-experience__repo-container">
            {contributions?.map((experience: any, index: number) => {
              return (
                <Fragment key={`${experience}+${index}`}>
                  {index < 3 && (
                    <div className={`member-project-experience__repo-container__repo ${contributions.length - 1 !== index && 'member-project-experience__repo-container__repo__border-set'}`}>
                      <MemberProjectExperienceCard experience={experience} />
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        )}
      </div>

      <div className="all-member-container">
        <Modal modalRef={modalRef} onClose={onClose}>
          <MemberProjectContributions contributions={contributions} />
        </Modal>
      </div>

      <style jsx>
        {`
          .member-project-experience {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .member-project-experience__header {
            display: flex;
            justify-content: space-between;
          }
          .member-project-experience__unable-to-load {
            background-color: rgb(249 250 251);
            border-radius: 12px;
            font-size: 14px;
            text-align: center;
            padding: 12px;
          }

          .member-project-experience__header__edit {
            font-size: 13px;
            color: #156ff7;
          }

          .member-project-experience__title {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            letter-spacing: 0px;
            text-align: left;
            color: #64748b;
          }

          .member-project-experience__repo-container {
            border-radius: 12px;
            box-shadow: 0px 4px 4px 0px #0f172a0a, 0px 0px 1px 0px #0f172a1f;
            border: 1px solid #e2e8f0;
          }

          .member-project-experience__repo-container__repo {
            padding: 16px;

            &:hover {
              background: linear-gradient(0deg, #f8fafc, #f8fafc), linear-gradient(0deg, #e2e8f0, #e2e8f0);
            }
          }

          .member-project-experience__repo-container__repo__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .member-project-experience__repo-container__repo__web {
            display: none;
          }

          .member-project-experience__header__options {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .member-project-experience__header__seeall-btn {
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            border: none;
            background-color: #fff;
          }

          .member-project-experience__header__edit-btn {
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            border: none;
            background-color: #fff;
          }

          @media (min-width: 1024px) {
            .member-project-experience__repo-container {
              max-height: 300px;
              overflow: auto;
              border: none;
            }
          }
        `}
      </style>
    </>
  );
};

export default MemberProjectContribution;
