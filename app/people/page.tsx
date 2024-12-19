import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { IMember, IMembersSearchParams } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getFormattedFilters, getMembersListOptions, getMembersOptionsFromQuery, getRoleTagsFromValues } from '@/utils/member.utils';
import { getFilterValuesForQuery, getMemberRoles } from '@/services/members.service';
import Error from '@/components/core/error';
import MembersToolbar from '@/components/page/members/members-toolbar';
import FilterWrapper from '@/components/page/members/filter-wrapper';
import EmptyResult from '@/components/core/empty-result';
import { Metadata } from 'next';
import { ITEMS_PER_PAGE, SOCIAL_IMAGE_URL } from '@/utils/constants';
import MemberInfiniteList from '@/components/page/members/member-infinite-list';
import { getMemberListForQuery } from '../actions/members.actions';

async function Page({ searchParams }: { searchParams: IMembersSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();
  const parsedUserDetails: IUserInfo = userInfo;

  const { members, isError, filters, totalMembers = 0, isLoggedIn } = await getPageData(searchParams as IMembersSearchParams);

  if (isError || !members) {
    return <Error />;
  }

  return (
    <section className={styles.members}>
      {/* Side-nav */}
      <aside className={styles.members__left}>
        <FilterWrapper searchParams={searchParams} filterValues={filters} userInfo={userInfo} isUserLoggedIn={isLoggedIn} />
      </aside>
      {/* Teams */}
      <div className={styles.members__right}>
        <div className={styles.members__right__content}>
          <div className={styles.members__right__toolbar}>
            <MembersToolbar searchParams={searchParams} totalTeams={totalMembers} userInfo={parsedUserDetails} />
          </div>
          <div className={styles.members__right__membersList} style={{ flex: 1 }}>
            {members?.length > 0 && <MemberInfiniteList isUserLoggedIn={isLoggedIn} members={members} totalItems={totalMembers} userInfo={parsedUserDetails} searchParams={searchParams} />}
            {members?.length === 0 && <EmptyResult />}
          </div>
        </div>
      </div>
    </section>
  );
}

const getPageData = async (searchParams: IMembersSearchParams) => {
  let members: IMember[] = [];
  let isError = false;
  let totalMembers = 0;
  let filters: any;

  try {
    const { isLoggedIn, authToken } = getCookiesFromHeaders();
    const filtersFromQueryParams = getMembersOptionsFromQuery(searchParams as IMembersSearchParams);
    const memberFilterQuery = getMembersListOptions(filtersFromQueryParams);

    const [rawFilterValues, availableFilters, memberList, memberRoles] = await Promise.all([
      getFilterValuesForQuery(null, authToken),
      getFilterValuesForQuery(filtersFromQueryParams, authToken),
      getMemberListForQuery(memberFilterQuery, 1, ITEMS_PER_PAGE, authToken),
      getMemberRoles(filtersFromQueryParams),
    ]);

    if (memberList?.isError || rawFilterValues?.isError || availableFilters?.isError || memberRoles?.isError) {
      return { isError: true, error: memberList?.error || rawFilterValues?.error || availableFilters?.error || memberRoles?.error };
    } 

    filters = getFormattedFilters(searchParams, rawFilterValues, availableFilters, isLoggedIn);
    filters.memberRoles = getRoleTagsFromValues(memberRoles, searchParams.memberRoles);
    members = memberList?.items;
    totalMembers = memberList?.total;
    
    return { isError, members, filters, totalMembers, isLoggedIn };
  } catch (error) {
    console.error(error);
    return { isError: true };
  }
};

export default Page;

export const metadata: Metadata = {
  title: 'People | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network people orient themselves within the network by making it easy to learn about other teams and people, including their roles, capabilities, and experiences.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
