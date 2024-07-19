'use client';

import { IAnalyticsUserInfo } from '@/types/shared.types';
import AllContributorsModal from './all-contributors-modal';
import { EVENTS } from '@/utils/constants';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { getAnalyticsMemberInfo, getAnalyticsProjectInfo, getAnalyticsUserInfo } from '@/utils/common.utils';

interface IContributors {
  contributors: any[];
  user: IAnalyticsUserInfo;
  project: any;
}

const Contributors = (props: IContributors) => {
  const contributors = props?.contributors ?? [];
  const contributorsLength = contributors?.length ?? 0;
  const project = props?.project;

  const slicedContributors = contributorsLength > 20 ? contributors.slice(0, 20) : contributors;
  const user = props.user;

  const analytics = useProjectAnalytics();

  const onCloseContributorsModal = () => {
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, { detail: false }));
  };

  const onOpenContributorsModal = () => {
    analytics.onProjDetailSeeAllContributorsClicked(getAnalyticsUserInfo(user), getAnalyticsProjectInfo(project));
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_CONTRIBUTORS_OPEN_AND_CLOSE, { detail: true }));
  };

  const onContributorClick = (contributor: any) => {
    analytics.onProjectDetailContributorClicked(getAnalyticsUserInfo(user), getAnalyticsProjectInfo(project), getAnalyticsMemberInfo(contributor));
    window.open('/members/' + contributor?.uid, '_blank');
  };

  return (
    <>
      <div className="contributors">
        <button className="contributors__hdr" onClick={onOpenContributorsModal}>
          <h6 className="contributors__hdr__title">Contributors</h6>
          <span className="contributors__hdr__count">{contributorsLength}</span>
        </button>
        <div className="contributors__body">
          <div className="contributors__body__list">
            {contributorsLength > 0 &&
              slicedContributors.map((contributor: any, index: number) => (
                <button key={`contributor-${index}`} className="contributors__body__list__contributor" title={contributor?.name} onClick={() => onContributorClick(contributor)}>
                  <img width={32} height={32} className="contributors__body__list__contributor__img" src={contributor.logo || '/icons/default_profile.svg'} />
                </button>
              ))}
            {contributorsLength > 20 && (
              <button className="contributors__body__list__remaining" onClick={onOpenContributorsModal}>
                +{contributorsLength - 20}
              </button>
            )}
          </div>
        </div>
      </div>
      <AllContributorsModal onContributorClickHandler={onContributorClick} onClose={onCloseContributorsModal} contributorsList={contributors} />
      <style jsx>{`
        button {
          background: none;
          border: none;
          outline: none;
        }

        .contributors__hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 14px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          width: 100%;
          color: #0f172a;
        }

        .contributors__hdr:hover {
          color: #156ff7;
        }

        .contributors__hdr__title {
          font-size: 18px;
          font-weight: 600;
          line-height: 28px;
          letter-spacing: 0.01em;
        }

        .contributors__hdr__count {
          height: 18px;
          padding: 2px 8px 2px 8px;
          border-radius: 24px;
          background-color: #dbeafe;
          color: #156ff7;
          font-size: 12px;
          font-weight: 500;
          line-height: 14px;
          letter-spacing: 0em;
        }

        .contributors__body {
          padding-top: 10px;
        }

        .contributors__body__list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .contributors__body__list__contributor {
          cursor: pointer;
        }

        .contributors__body__list__contributor__img {
          border-radius: 50%;
          object-fit: cover;
        }

        .contributors__body__list__contributor__img:hover {
          border: 2px solid #156ff7;
        }

        .contributors__body__list__remaining {
          width: 32px;
          height: 32px;
          background-color: #f1f5f9;
          color: #64748b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 10px;
          font-weight: 500;
          line-height: 8px;
          letter-spacing: 0px;
        }

        .contributors__body__list__remaining:hover {
          background-color: #156ff7;
          color: #fff;
        }
      `}</style>
    </>
  );
};

export default Contributors;
