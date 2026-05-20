import { ITeamsSearchParams } from '@/types/teams.types';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import FiltersContent from './FiltersContent';

async function Page(props: { searchParams: Promise<ITeamsSearchParams> }) {
  const searchParams = await props.searchParams;
  const { userInfo } = await getCookiesFromHeaders();

  return <FiltersContent searchParams={searchParams} userInfo={userInfo} />;
}

export default Page;
