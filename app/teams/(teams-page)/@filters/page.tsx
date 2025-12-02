import { ITeamsSearchParams } from '@/types/teams.types';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import FiltersContent from './FiltersContent';

async function Page({ searchParams }: { searchParams: ITeamsSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  return <FiltersContent searchParams={searchParams} userInfo={userInfo} />;
}

export default Page;
