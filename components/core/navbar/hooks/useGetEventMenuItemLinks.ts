import { useMemo } from 'react';

import { isAdminUser } from '@/utils/user/isAdminUser';
import { useCurrentUserStore } from '@/services/auth/store';

import { ALL_EVENTS_LINK, IRL_GATHERING_LINK, EVENT_CONTRIBUTORS_LINK } from '../constants/navLinks';

export function useGetEventMenuItemLinks() {
  const currentUser = useCurrentUserStore((state) => state.currentUser);
  const isAdmin = isAdminUser(currentUser);

  return useMemo(() => {
    const links = [ALL_EVENTS_LINK, EVENT_CONTRIBUTORS_LINK];

    if (isAdmin) {
      links.unshift(IRL_GATHERING_LINK);
    }

    return links;
  }, [isAdmin]);
}
