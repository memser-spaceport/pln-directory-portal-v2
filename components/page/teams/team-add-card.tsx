'use client';

import { useCommonAnalytics } from '@/analytics/common.analytics';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const TeamAddCard = (props: any) => {
  // props
  const viewType = props?.viewType;

  //variable
  const analytics = useCommonAnalytics();
  const userInfo = props?.userInfo;
  const router = useRouter();

  //method
  const onAddClick = () => {
    analytics.onSubmitATeamBtnClicked();
    router.push(PAGE_ROUTES.ADD_TEAM);
  };

  return (
    <>
      <div className={`${viewType === VIEW_TYPE_OPTIONS.LIST ? 'team-card--div' : ''}`}>
        <Link href={PAGE_ROUTES.ADD_TEAM} prefetch={false} legacyBehavior>
          <a
            onClick={onAddClick}
            className={`team-card  ${viewType === VIEW_TYPE_OPTIONS.LIST ? 'team-card--list' : ''}`}
          >
            <img src="/icons/add.svg" alt="add" />
            <p className="team-card__add">Add Team</p>
            <p className="team-card__text">List your team here</p>
          </a>
        </Link>
      </div>
      <style jsx>
        {`
          .team-card--div {
            padding-right: 16px;
            padding-left: 16px;
          }

          .team-card {
            width: 167px;
            background-color: #fff;
            border-radius: 12px;
            border: 1px #156ff7;
            border-style: dashed;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            padding: 24px;
            height: 168px;
          }

          .team-card--list {
            width: 100%;
            height: 112px;
            padding: 0px 16px;
          }

          .team-card:hover {
            box-shadow: 0px 0px 0px 2px #156ff740;
          }

          .team-card__add {
            font-weight: 500;
            font-size: 16px;
            line-height: 26px;
            color: #156ff7;
          }

          .team-card__text {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #64748b;
          }

          @media (min-width: 1024px) {
            .team-card {
              width: 289px;
              height: 267px;
            }

            .team-card--list {
              width: 100%;
              height: 112px;
            }

            .team-card--div {
              padding: 0px;
            }
          }
        `}
      </style>
    </>
  );
};

export default TeamAddCard;
