'use client';

import { clsx } from 'clsx';
import Link from 'next/link';
import InfiniteScroll from 'react-infinite-scroll-component';

import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import { IMember } from '@/types/members.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import { useInfiniteMembersList } from '@/services/members/hooks/useInfiniteMembersList';
import { CardsLoader } from '@/components/core/loaders/CardsLoader';
import { ListLoader } from '@/components/core/loaders/ListLoader';
import { MembersMobileFilters } from '@/components/page/members/MembersFilter/MembersMobileFilters';
import EmptyResult from '@/components/core/empty-result';

import MemberGridView from '../member-grid-view';
import MemberListView from '../member-list-view';

import s from './MemberInfiniteList.module.scss';

const MemberInfiniteList = (props: any) => {
  const members = props?.members ?? [];
  const userInfo = props?.userInfo;
  const searchParams = props?.searchParams;
  const totalItems = props?.totalItems;
  const isUserLoggedIn = props?.isUserLoggedIn;
  const analytics = useMemberAnalytics();
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;

  const onMemberOnClickHandler = (e: any, member: IMember) => {
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
    <div className={s.root}>
      <div className={s.header}>
        <h1 className={s.title}>Members</h1>
        <div className={s.count}>({totalItems})</div>
      </div>
      <MembersMobileFilters userInfo={userInfo} isUserLoggedIn={isUserLoggedIn} searchParams={searchParams} />
      {members?.length === 0 && <EmptyResult />}
      <InfiniteScroll
        scrollableTarget="body"
        loader={null}
        hasMore={hasNextPage}
        dataLength={data.length}
        next={fetchNextPage}
        style={{ overflow: 'unset' }}
      >
        <div
          className={clsx({
            [s.grid]: VIEW_TYPE_OPTIONS.GRID === viewType,
            [s.list]: VIEW_TYPE_OPTIONS.LIST === viewType,
          })}
        >
          {data?.map((member) => (
            <Link
              prefetch={false}
              href={`${PAGE_ROUTES.MEMBERS}/${member?.id}`}
              key={member.id}
              className={clsx(s.member, {
                [s.listMember]: VIEW_TYPE_OPTIONS.LIST === viewType,
              })}
              onClick={(e) => onMemberOnClickHandler(e, member)}
            >
              {VIEW_TYPE_OPTIONS.GRID === viewType && (
                <MemberGridView isUserLoggedIn={isUserLoggedIn} member={member} />
              )}
              {VIEW_TYPE_OPTIONS.LIST === viewType && (
                <MemberListView isUserLoggedIn={isUserLoggedIn} member={member} />
              )}
            </Link>
          ))}
          {isFetchingNextPage && <Loader />}
        </div>
      </InfiniteScroll>
    </div>
  );
};

export default MemberInfiniteList;
