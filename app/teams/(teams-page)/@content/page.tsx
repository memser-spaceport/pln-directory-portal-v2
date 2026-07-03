import { getCookiesFromHeaders } from '@/utils/next-helpers';
import TeamsContent from './TeamsContent';

async function Page() {
  const { userInfo, isLoggedIn } = await getCookiesFromHeaders();

  return <TeamsContent userInfo={userInfo} isLoggedIn={Boolean(isLoggedIn)} />;
}

export default Page;
