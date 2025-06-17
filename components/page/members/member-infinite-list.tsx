'use client';

import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import MemberGridView from './member-grid-view';
import MemberListView from './member-list-view';
import { IMember } from '@/types/members.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import Link from 'next/link';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useInfiniteMembersList } from '@/services/members/hooks/useInfiniteMembersList';
import { CardsLoader } from '@/components/core/loaders/CardsLoader';
import { ListLoader } from '@/components/core/loaders/ListLoader';

const MemberInfiniteList = (props: any) => {
  const members = props?.members ?? [];
  const userInfo = props?.userInfo;
  const searchParams = props?.searchParams;
  const totalItems = props?.totalItems;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const analytics = useMemberAnalytics();
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;

  const onMemberOnClickHandler = (e: any, member: IMember) => {
    if (!e.ctrlKey) {
      triggerLoader(true);
    }
    analytics.onMemberCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member), viewType);
  };

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useInfiniteMembersList(
    {
      searchParams,
    },
    {
      initialData: { items: members, total: totalItems },
    },
  );

  const Loader = VIEW_TYPE_OPTIONS.GRID === viewType ? CardsLoader : ListLoader;

  return (
    <>
      <div className="members-list">
        <div className="members-list__titlesec">
          <h1 className="members-list__titlesec__title">Members</h1> <div className="members-list__title__count">({totalItems})</div>
        </div>
        <InfiniteScroll scrollableTarget="body" loader={null} hasMore={hasNextPage} dataLength={data.length} next={fetchNextPage} style={{ overflow: 'unset' }}>
          <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'members-list__grid' : 'members-list__list'}`}>
            {data?.map((member) => (
              <Link
                prefetch={false}
                href={`${PAGE_ROUTES.MEMBERS}/${member?.id}`}
                key={member.id}
                className={`members-list__member ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'members-list__grid__member' : 'members-list__list__member'}`}
                onClick={(e) => onMemberOnClickHandler(e, member)}
              >
                {VIEW_TYPE_OPTIONS.GRID === viewType && <MemberGridView isUserLoggedIn={isUserLoggedIn} member={member} />}
                {VIEW_TYPE_OPTIONS.LIST === viewType && <MemberListView isUserLoggedIn={isUserLoggedIn} member={member} />}
              </Link>
            ))}
            {isFetchingNextPage && <Loader />}
          </div>
        </InfiniteScroll>
      </div>
      <style jsx>{`
        .members-list {
          width: 100%;
          margin-bottom: 10px;
          height: 100%;
          overflow-y: auto;
        }

        .members-list__titlesec {
          display: flex;
          gap: 4px;
          align-items: baseline;
          padding: 12px 16px;
          //position: sticky;
          //top: 150px;
          z-index: 3;
          background: #f1f5f9;
        }

        .members-list__titlesec__title {
          font-size: 24px;
          line-height: 40px;
          font-weight: 700;
          color: #0f172a;
        }

        .members-list__title__count {
          font-size: 14px;
          font-weight: 400;
          color: #64748b;
        }

        .members-list__member {
          cursor: pointer;
        }

        .members-list__grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, 167.5px);
          justify-content: center;
          row-gap: 24px;
          column-gap: 16px;
          width: 100%;
          padding: 8px 0;
        }

        .members-list__list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
          padding: 8px;
        }

        .members-list__list__member {
          margin: 0 16px;
        }

        @media (min-width: 1024px) {
          .members-list__list__members {
            padding: 0 0;
          }

          .members-list__grid {
            grid-template-columns: repeat(auto-fit, 289px);
            //padding: unset;
          }

          .members-list__titlesec {
            display: none;
          }

          .members-list__list {
            padding: 0 20px;
          }
        }
      `}</style>
    </>
  );
};

export default MemberInfiniteList;
