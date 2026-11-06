import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getServerTeamsPage } from '@/services/teams/getServerTeamsPage';
import TeamsContent from './TeamsContent';
import { BrowseAllLink } from '@/components/page/browse/BrowseIndexPage';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function Page({ searchParams }: PageProps) {
  const [{ userInfo, isLoggedIn, authToken }, params] = await Promise.all([getCookiesFromHeaders(), searchParams]);
  const serverPage = await getServerTeamsPage(params, authToken);

  return (
    <>
      <TeamsContent userInfo={userInfo} isLoggedIn={Boolean(isLoggedIn)} serverPage={serverPage} />
      {/* The list shows 50 teams to a crawler; the index links every one (LAB-3093). */}
      <BrowseAllLink kind="teams" />
    </>
  );
}

export default Page;
