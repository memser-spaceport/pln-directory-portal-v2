import { ITeamsSearchParams } from '@/types/teams.types';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import Error from '../../../../components/core/error';
import FilterWrapper from '../../../../components/page/teams/filter-wrapper';
import { getTeamsFiltersData } from '@/app/teams/(teams-page)/getTeamsPageData';

async function Page({ searchParams }: { searchParams: ITeamsSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  const { filterValues, isError } = await getPageData(searchParams);

  if (isError) {
    return <Error />;
  }

  return <FilterWrapper searchParams={searchParams} filterValues={filterValues} userInfo={userInfo} />;
}

export default Page;

const getPageData = async (searchParams: ITeamsSearchParams) => {
  return getTeamsFiltersData(searchParams);
};
