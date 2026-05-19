import { getCookiesFromHeaders } from '@/utils/next-helpers';
import TeamsContent from './TeamsContent';

async function Page() {
  const { userInfo } = getCookiesFromHeaders();

  return <TeamsContent userInfo={userInfo} />;
}

export default Page;
