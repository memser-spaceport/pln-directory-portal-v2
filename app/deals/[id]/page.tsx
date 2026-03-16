import { redirect } from 'next/navigation';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { hasDealsAccess } from '@/utils/user/hasDealsAccess';
import DealDetailContent from './DealDetailContent';

export default function Page({ params }: { params: { id: string } }) {
  const { userInfo } = getCookiesFromHeaders();

  if (!hasDealsAccess(userInfo)) {
    redirect('/members');
  }

  return <DealDetailContent id={params.id} />;
}
