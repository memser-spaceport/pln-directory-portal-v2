import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getServerTeamsPage } from '@/services/teams/getServerTeamsPage';
import TeamsContent from './TeamsContent';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function Page({ searchParams }: PageProps) {
  const [{ userInfo, isLoggedIn, authToken }, params] = await Promise.all([getCookiesFromHeaders(), searchParams]);
  const serverPage = await getServerTeamsPage(params, authToken);

  return <TeamsContent userInfo={userInfo} isLoggedIn={Boolean(isLoggedIn)} serverPage={serverPage} />;
}

export default Page;
