import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { IMember, IMembersSearchParams } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getMembersListOptions, getMembersOptionsFromQuery } from '@/utils/member.utils';
import Error from '@/components/core/error';
import MembersToolbar from '@/components/page/members/members-toolbar';
import EmptyResult from '@/components/core/empty-result';
import { INITIAL_ITEMS_PER_PAGE } from '@/utils/constants';
import MemberInfiniteList from '@/components/page/members/member-infinite-list';
import { getMemberListForQuery } from '@/app/actions/members.actions';

async function Page({ searchParams }: { searchParams: IMembersSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();
  const parsedUserDetails: IUserInfo = userInfo;

  const { members, isError, totalMembers = 0, isLoggedIn } = await getPageData(searchParams as IMembersSearchParams);

  if (isError || !members) {
    return <Error />;
  }

  return (
    <div className={styles.members__right__content}>
      <div className={styles.members__right__toolbar}>
        <MembersToolbar searchParams={searchParams} totalTeams={totalMembers} userInfo={parsedUserDetails} />
      </div>
      <div className={styles.members__right__membersList} style={{ flex: 1 }}>
        {members?.length > 0 && <MemberInfiniteList isUserLoggedIn={isLoggedIn} members={members} totalItems={totalMembers} userInfo={parsedUserDetails} searchParams={searchParams} />}
        {members?.length === 0 && <EmptyResult />}
      </div>
    </div>
  );
}

const getPageData = async (searchParams: IMembersSearchParams) => {
  let members: IMember[] = [];
  let isError = false;
  let totalMembers = 0;

  try {
    const { isLoggedIn, authToken } = getCookiesFromHeaders();
    const filtersFromQueryParams = getMembersOptionsFromQuery(searchParams as IMembersSearchParams);
    const memberFilterQuery = getMembersListOptions(filtersFromQueryParams);

    const memberList = await getMemberListForQuery(memberFilterQuery, 1, INITIAL_ITEMS_PER_PAGE, authToken);

    if (memberList?.isError) {
      return { isError: true, error: memberList?.error};
    } 

    members = memberList?.items;
    totalMembers = memberList?.total;
    
    return { isError, members, totalMembers, isLoggedIn };
  } catch (error) {
    console.error(error);
    return { isError: true };
  }
};

export default Page;
