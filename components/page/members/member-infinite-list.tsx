'use client';

import { ITEMS_PER_PAGE, PAGE_ROUTES, TOAST_MESSAGES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import MemberGridView from './member-grid-view';
import MemberListView from './member-list-view';
import { IMember, IMemberListOptions } from '@/types/members.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import Link from 'next/link';
import usePagination from '@/hooks/irl/use-pagination';
import { useEffect, useRef, useState } from 'react';
import { getMembersListOptions, getMembersOptionsFromQuery } from '@/utils/member.utils';
import cookies from 'js-cookie';
import TableLoader from '@/components/core/table-loader';
import { getMemberListForQuery } from '@/app/actions/members.actions';

const MemberInfiniteList = (props: any) => {
  const members = props?.members ?? [];
  const userInfo = props?.userInfo;
  const searchParams = props?.searchParams;
  const totalItems = props?.totalItems;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const analytics = useMemberAnalytics();
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;
  const [userList, setUserList] = useState<any>({ users: members, totalItems: totalItems });
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const { currentPage, setPagination } = usePagination({
    observerTargetRef: observerTarget,
    totalItems: totalItems,
    totalCurrentItems: userList?.users?.length,
  });

  const onMemberOnClickHandler = (e: any, member: IMember) => {
    if (!e.ctrlKey) {
      triggerLoader(true);
    }
    analytics.onMemberCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member), viewType);
    // router.push(`${PAGE_ROUTES.MEMBERS}/${id}`, {scroll: false})
  };

  const getAllMembers = async () => {
    const toast = (await import('react-toastify')).toast;
    try {
      setIsLoading(true);
      const authToken = cookies.get('authToken');
      const optionsFromQuery = getMembersOptionsFromQuery(searchParams);
      const listOptions: IMemberListOptions = getMembersListOptions(optionsFromQuery);
      const teamsRes = await getMemberListForQuery(listOptions, currentPage, ITEMS_PER_PAGE, authToken);
      if (teamsRes.isError) {
        setIsLoading(false);
        toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
        return;
      }
      setUserList((prev: any) => ({ users: [...prev.users, ...teamsRes?.items], totalItems: teamsRes?.total }));
    } catch (error) {
      console.error('Error in fetching teams', error);
      toast.error(TOAST_MESSAGES.SOMETHING_WENT_WRONG);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentPage !== 1) {
      const fetchData = async () => {
        await getAllMembers();
      };

      fetchData();
    }
  }, [currentPage]);

    // Sync team list
    useEffect(() => {
    setPagination({ page: 1, limit: ITEMS_PER_PAGE});
    setUserList({ users: members, totalItems: totalItems });
  }, [members]);

  return (
    <>
      <div>
        <div className="members-list">
          <div className="members-list__titlesec">
            <h1 className="members-list__titlesec__title">People</h1> <div className="members-list__title__count">({totalItems})</div>
          </div>
          <div className={`${VIEW_TYPE_OPTIONS.GRID === viewType ? 'members-list__grid' : 'members-list__list'}`}>
          {[...userList?.users]?.map((member: any, index: number) => (
                <Link
                  href={`${PAGE_ROUTES.MEMBERS}/${member?.id}`}
                  key={`memberitem-${member?.id}-${index}`}
                  className={`members-list__member ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'members-list__grid__member' : 'members-list__list__member'}`}
                  onClick={(e) => onMemberOnClickHandler(e, member)}
                  // scroll={false}
                >
                  {VIEW_TYPE_OPTIONS.GRID === viewType && <MemberGridView isUserLoggedIn={isUserLoggedIn} member={member} />}
                  {VIEW_TYPE_OPTIONS.LIST === viewType && <MemberListView isUserLoggedIn={isUserLoggedIn} member={member} />}
                </Link>
              ))}
            <div ref={observerTarget} />
          </div>
          {isLoading && <TableLoader />}
        </div>
      </div>
      <style jsx>{`
        .members-list {
          width: 100%;
          margin-bottom: 10px;
        }

        .members-list__titlesec {
          display: flex;
          gap: 4px;
          align-items: baseline;
          padding: 12px 16px;
          position: sticky;
          top: 150px;
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
          justify-content: center;
          padding: 2px;
        }

        .members-list__list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 16px;
          padding: 0px 8px;
        }

        .members-list__list__member {
          margin: 0px 16px;
        }

        @media (min-width: 1024px) {
          .members-list__list__members {
            padding: 0px 0px;
          }

          .members-list__grid {
            grid-template-columns: repeat(auto-fit, 289px);
            padding: unset;
          }

          .members-list__titlesec {
            display: none;
          }

          .members-list__list {
            padding: 0px 20px;
          }
        }
      `}</style>
    </>
  );
};

export default MemberInfiniteList;
