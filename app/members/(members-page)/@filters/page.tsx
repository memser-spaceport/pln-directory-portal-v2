import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { IMembersSearchParams } from '@/types/members.types';
import { getFormattedFilters, getMembersOptionsFromQuery, getRoleTagsFromValues } from '@/utils/member.utils';
import { getFilterValuesForQuery, getMemberRoles } from '@/services/members.service';
import Error from '@/components/core/error';
import FilterWrapper from '@/components/page/members/filter-wrapper';

async function Page({ searchParams }: { searchParams: IMembersSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  const { isError, filters, isLoggedIn } = await getPageData(searchParams as IMembersSearchParams);

  if (isError) {
    return <Error />;
  }

  return (
    <FilterWrapper searchParams={searchParams} filterValues={filters} userInfo={userInfo} isUserLoggedIn={isLoggedIn} />
  );
}

const getPageData = async (searchParams: IMembersSearchParams) => {
  let isError = false;
  let filters: any;

  try {
    const { isLoggedIn, authToken } = getCookiesFromHeaders();
    const filtersFromQueryParams = getMembersOptionsFromQuery(searchParams as IMembersSearchParams);

    const [rawFilterValues, availableFilters, memberRoles] = await Promise.all([
      getFilterValuesForQuery(null, authToken),
      getFilterValuesForQuery(filtersFromQueryParams, authToken),
      getMemberRoles(filtersFromQueryParams),
    ]);

    if (rawFilterValues?.isError || availableFilters?.isError || memberRoles?.isError) {
      return { isError: true, error: rawFilterValues?.error || availableFilters?.error || memberRoles?.error };
    } 

    filters = getFormattedFilters(searchParams, rawFilterValues, availableFilters, isLoggedIn);
    filters.memberRoles = getRoleTagsFromValues(memberRoles, searchParams.memberRoles);
    
    return { isError, filters, isLoggedIn };
  } catch (error) {
    console.error(error);
    return { isError: true };
  }
};

export default Page;
