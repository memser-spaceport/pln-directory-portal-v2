import { getCookiesFromHeaders } from '@/utils/next-helpers';
import JobsContent from './JobsContent';

export default function Page() {
  const { userInfo, isLoggedIn } = getCookiesFromHeaders();
  return <JobsContent userInfo={userInfo} isLoggedIn={!!isLoggedIn} />;
}
