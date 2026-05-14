import { getCookiesFromHeaders } from '@/utils/next-helpers';
import JobsContent from './JobsContent';

export default async function Page() {
  const { userInfo, isLoggedIn } = await getCookiesFromHeaders();
  return <JobsContent userInfo={userInfo} isLoggedIn={!!isLoggedIn} />;
}
