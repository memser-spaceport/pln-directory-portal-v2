import { usePathname, useSearchParams } from 'next/navigation';

import { IRL_GATHERING_ROUTE } from '@/constants/routes';

export function useGetPathToCompareNotificationLink() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return pathname.includes(IRL_GATHERING_ROUTE) ? `${pathname}?${searchParams.toString()}` : pathname;
}
