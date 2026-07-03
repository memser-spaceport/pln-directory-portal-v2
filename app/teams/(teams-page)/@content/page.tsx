import { getCookiesFromHeaders } from '@/utils/next-helpers';
import TeamsContent from './TeamsContent';

async function Page() {
  const { userInfo } = await getCookiesFromHeaders();

  return <TeamsContent userInfo={userInfo} />;
}

export default Page;
