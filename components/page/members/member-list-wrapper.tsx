'use client';

import { PAGE_ROUTES, VIEW_TYPE_OPTIONS } from '@/utils/constants';
import MembersList from './members-list';
import MemberGridView from './member-grid-view';
import MemberListView from './member-list-view';
import { IMember } from '@/types/members.types';
import { getAnalyticsMemberInfo, getAnalyticsUserInfo, triggerLoader } from '@/utils/common.utils';
import { useMemberAnalytics } from '@/analytics/members.analytics';
import Link from 'next/link';

const MemberListWrapper = (props: any) => {
  const isUserLoggedIn = props?.isUserLoggedIn;
  const searchParams = props?.searchParams;
  const viewType = searchParams['viewType'] || VIEW_TYPE_OPTIONS.GRID;
  const members = props?.members ?? [];
  const userInfo = props?.userInfo;

  const analytics = useMemberAnalytics();

  const onMemberOnClickHandler = (member: IMember) => {
    analytics.onMemberCardClicked(getAnalyticsUserInfo(userInfo), getAnalyticsMemberInfo(member), viewType);
    triggerLoader(true);
  };

  return (
    <MembersList {...props}>
      {members?.map((member: any, index: number) => (
        <Link
          href={`${PAGE_ROUTES.MEMBERS}/${member?.id}`}
          key={`member-${viewType}-${index}`}
          className={`members-list__member ${VIEW_TYPE_OPTIONS.GRID === viewType ? 'members-list__grid__member' : 'members-list__list__member'}`}
          onClick={() => onMemberOnClickHandler(member)}
        >
          {VIEW_TYPE_OPTIONS.GRID === viewType && <MemberGridView isUserLoggedIn={isUserLoggedIn} member={member} />}
          {VIEW_TYPE_OPTIONS.LIST === viewType && <MemberListView isUserLoggedIn={isUserLoggedIn} member={member} />}
        </Link>
      ))}
    </MembersList>
  );
};

export default MemberListWrapper;
