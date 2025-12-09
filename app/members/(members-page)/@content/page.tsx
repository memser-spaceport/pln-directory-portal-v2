import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.scss';
import { IMember } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import Error from '@/components/core/error';
import { INITIAL_ITEMS_PER_PAGE } from '@/utils/constants';
import MemberInfiniteList from '@/components/page/members/MemberInfiniteList';
import { getMemberListForQuery } from '@/app/actions/members.actions';
import qs from 'qs';
import { OFFICE_HOURS_FILTER_PARAM_KEY, TOPICS_FILTER_PARAM_KEY } from '@/app/constants/filters';
import MembersToolbar from '@/components/page/members/members-toolbar';

async function Page({ searchParams }: { searchParams: Record<string, string> }) {
  const { userInfo } = getCookiesFromHeaders();
  const parsedUserDetails: IUserInfo = userInfo;

  const { members, isError, totalMembers = 0, isLoggedIn } = await getPageData(searchParams);

  if (isError || !members) {
    return <Error />;
  }

  return (
    <div className={styles.members__right__content}>
      <div className={styles.members__right__toolbar}>
        <MembersToolbar searchParams={searchParams} totalMembers={totalMembers} userInfo={parsedUserDetails} />
      </div>
      <div className={styles.members__right__membersList} style={{ flex: 1 }}>
        <MemberInfiniteList
          isUserLoggedIn={isLoggedIn}
          members={members}
          totalItems={totalMembers}
          userInfo={parsedUserDetails}
          searchParams={searchParams}
        />
      </div>
    </div>
  );
}

const getPageData = async (searchParams: Record<string, string>) => {
  let members: IMember[] = [];
  let isError = false;
  let totalMembers = 0;

  if (!!searchParams[TOPICS_FILTER_PARAM_KEY]) {
    searchParams[OFFICE_HOURS_FILTER_PARAM_KEY] = 'true';
  }

  try {
    const { isLoggedIn, authToken } = getCookiesFromHeaders();

    const invType = searchParams.investorType?.split('|') || '';

    if (invType.length > 0) {
      invType.push('ANGEL_AND_FUND');
    }

    const query = qs.stringify({
      ...searchParams,
      roles: searchParams.roles?.split('|'),
      topics: searchParams.topics?.split('|') || '',
      investorType: invType,
      sort: searchParams.sort
        ?.split(',')
        .map((s) => s.toLowerCase())
        .join(':'),
    });

    const memberList = await getMemberListForQuery(query, 1, INITIAL_ITEMS_PER_PAGE, authToken);

    if (memberList?.isError) {
      return { isError: true, error: memberList?.error };
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
