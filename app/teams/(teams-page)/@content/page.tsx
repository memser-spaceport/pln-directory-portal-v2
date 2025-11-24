import { ITeamsSearchParams } from '@/types/teams.types';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import TeamsContent from './TeamsContent';

async function Page({ searchParams }: { searchParams: ITeamsSearchParams }) {
  const { userInfo } = getCookiesFromHeaders();

  return <TeamsContent searchParams={searchParams} userInfo={userInfo} />;
}

export default Page;
