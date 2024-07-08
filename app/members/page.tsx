import { getCookiesFromHeaders } from '@/utils/next-helpers';
import styles from './page.module.css';
import { IMember, IMembersSearchParams } from '@/types/members.types';
import { IUserInfo } from '@/types/shared.types';
import { getMembersListOptions, getMembersOptionsFromQuery, parseMemberFilters } from '@/utils/member.utils';
import { getMemberRoles, getMembers, getMembersFilters } from '@/services/members.service';
import Error from '@/components/core/error';
import MembersList from '@/components/page/members/members-list';
import MembersToolbar from '@/components/page/members/members-toolbar';
import FilterWrapper from '@/components/page/members/filter-wrapper';
import EmptyResult from '@/components/core/empty-result';
import MemberListWrapper from '@/components/page/members/member-list-wrapper';
import { Metadata } from 'next';

async function Page({ searchParams }: { searchParams: IMembersSearchParams }) {
  const { refreshToken, userInfo, authToken } = getCookiesFromHeaders();
  const parsedUserDetails: IUserInfo = userInfo;

  const { members, isError, filters, totalMembers = 0, isLoggedIn } = await getPageData(searchParams as IMembersSearchParams);

  if (isError) {
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
          <MembersToolbar searchParams={searchParams} totalTeams={members.length} userInfo={parsedUserDetails} />
        </div>
        <div className={styles.members__right__membersList} style={{ flex: 1 }}>
          {members?.length > 0 && <MemberListWrapper isUserLoggedIn={isLoggedIn} members={members} totalMembers={totalMembers} userInfo={parsedUserDetails} searchParams={searchParams} />}
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
    const { isLoggedIn } = getCookiesFromHeaders();

    const optionsFromQuery = getMembersOptionsFromQuery(searchParams as IMembersSearchParams);
    const listOptions = getMembersListOptions(optionsFromQuery);

    const [membersResosponse, membersFiltersResponse, roleValues] = await Promise.all([
      getMembers(listOptions, '', 0, 0, isLoggedIn),
      getMembersFilters(optionsFromQuery, isLoggedIn),
      getMemberRoles(optionsFromQuery),
    ]);

    const updatedFilters = parseMemberFilters(membersFiltersResponse, searchParams, isLoggedIn, roleValues);
    filters = updatedFilters?.data?.formattedData;
    if (membersResosponse?.error) {
      isError = true;
      return { isError, members, filters };
    }

    members = membersResosponse?.data?.formattedData;
    totalMembers = members?.length;
    return { isError, members, filters, totalMembers, isLoggedIn };
  } catch (error) {
    isError = true;
    return { isError, members, filters };
  }
};

export default Page;

export const metadata: Metadata = {
  title: 'Members | Protocol Labs Directory',
  description:
    'The Protocol Labs Directory helps network members orient themselves within the network by making it easy to learn about other teams and members, including their roles, capabilities, and experiences.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: `https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`https://plabs-assets.s3.us-west-1.amazonaws.com/logo/protocol-labs-open-graph.jpg`],
  },
};
