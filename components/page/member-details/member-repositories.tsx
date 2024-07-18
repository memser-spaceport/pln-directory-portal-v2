'use client';

import { Fragment, useRef } from 'react';
import MemberDetailsRepoCard from './member-details-repo-card';
import MemberEmptyProject from './member-empty-repository';
import Modal from '@/components/core/modal';
import AllRepositories from './all-repositories';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

interface IMemberRepositories {
  member: IMember;
  userInfo: IUserInfo;
}

const MemberRepositories = (props: IMemberRepositories) => {
  const member = props?.member;
  const repositories: any = member?.repositories;
  const userInfo = props?.userInfo;

  const modalRef = useRef<HTMLDialogElement>(null);
  const analytics = useMemberAnalytics();
  const itemsToShow = Array.isArray(repositories) ? repositories?.slice(0, 3) : [];

  const onClose = () => {
    if (modalRef.current) {
      document.dispatchEvent(new CustomEvent('close-member-repos-modal'));
      modalRef.current.close();
    }
  };

  const onSeeAllClickHandler = () => {
    if (modalRef.current) {
      modalRef.current.showModal();
    }
    analytics.onGithubSeeAllClicked(getAnalyticsMemberInfo(member), getAnalyticsUserInfo(userInfo));
  };

  return (
    <>
      {repositories && (
        <div className="member-repo">
          {Array.isArray(repositories) && (
            <div className="member-repo__header">
              <h2 className="member-repo__title">Repositories {repositories && Array.isArray(repositories) ? `(${repositories?.length})` : ''}</h2>
              {repositories?.length > 3 && Array.isArray(repositories) && (
                <button className="member-repo__header__seeall-btn" onClick={onSeeAllClickHandler}>
                  See all
                </button>
              )}
            </div>
          )}

          {!Array.isArray(repositories) && repositories?.statusCode == 500 && (
            <div className="member-repo__unable-to-load">
              <p>Unable to load repositories</p>
            </div>
          )}

          {Array.isArray(repositories) &&
            (repositories?.length > 0 ? (
              <div className="member-repo__repo-container">
                {itemsToShow?.map((repository: any, index: number) => {
                  return (
                    <Fragment key={`${repository}+${index}`}>
                      <div className={`member-repo__repo-container__repo ${itemsToShow.length - 1 !== index ? 'member-repo__repo-container__repo__border-set' : ''}`}>
                        <MemberDetailsRepoCard repo={repository} userInfo={userInfo} memebr={member} />
                      </div>
                    </Fragment>
                  );
                })}
              </div>
            ) : (
              <div className="member-repo__empty-repo">
                <MemberEmptyProject profileType="member" member={member} userInfo={userInfo} />
              </div>
            ))}
        </div>
      )}

      {Array.isArray(repositories) && (
        <div className="all-member-container">
          <Modal modalRef={modalRef} onClose={onClose}>
            <AllRepositories userInfo={userInfo} member={member} allRepos={repositories} />
          </Modal>
        </div>
      )}

      <style jsx>
        {`
          .member-repo {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            background: #fff;
          }

          .member-repo__unable-to-load {
            background-color: rgb(249 250 251);
            border-radius: 12px;
            font-size: 12px;
            padding: 12px;
            color: #000;
          }

          .member-repo__header {
            display: flex;
            justify-content: space-between;
          }

          .member-repo__header__seeall-btn {
            color: #156ff7;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            border: none;
            background-color: #fff;
          }

          .member-repo__title {
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            letter-spacing: 0px;
            text-align: left;
            color: #64748b;
          }

          .member-repo__repo-container {
            border-radius: 12px;
            max-height: 300px;
            box-shadow: 0px 4px 4px 0px #0f172a0a;
            box-shadow: 0px 0px 1px 0px #0f172a1f;
          }

          .member-repo__empty-repo {
          }

          .member-repo__repo-container__repo {
            &:hover {
              background: linear-gradient(0deg, #f8fafc, #f8fafc), linear-gradient(0deg, #e2e8f0, #e2e8f0);
            }
          }

          .member-repo__repo-container__repo__border-set {
            border-bottom: 1px solid #e2e8f0;
          }

          .member-repo__repo-container__repo__web {
            display: none;
          }

          @media (min-width: 1024px) {
            .member-repo__repo-container {
              max-height: 300px;
              overflow: auto;
            }
            .member-repo__repo-container__repo__mob {
              display: none;
            }

            .member-repo__repo-container__repo__web {
              display: unset;
            }
          }

          @media (min-width: 1024px) {
            .member-repo {
              border-radius: 8px;
            }
          }
        `}
      </style>
    </>
  );
};

export default MemberRepositories;
