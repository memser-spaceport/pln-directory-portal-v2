import { renderHook } from '@testing-library/react';

import type { IUserInfo } from '@/types/shared.types';
import {
  ALL_EVENTS_LINK,
  IRL_GATHERING_LINK,
  EVENT_CONTRIBUTORS_LINK,
} from '@/components/core/navbar/constants/navLinks';
import { useCurrentUserStore } from '@/services/auth/store';
import { useGetEventMenuItemLinks } from '@/components/core/navbar/hooks/useGetEventMenuItemLinks';

const member = { uid: 'member-1', rbac: { effectivePermissions: [] } } as unknown as IUserInfo;
const admin = {
  uid: 'admin-1',
  rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
} as unknown as IUserInfo;

function linksFor(currentUser: IUserInfo | null) {
  useCurrentUserStore.setState({ currentUser });
  return renderHook(() => useGetEventMenuItemLinks()).result.current;
}

describe('useGetEventMenuItemLinks', () => {
  afterEach(() => {
    useCurrentUserStore.setState({ currentUser: null });
  });

  it('leads with IRL Gatherings for an admin', () => {
    expect(linksFor(admin)).toEqual([IRL_GATHERING_LINK, ALL_EVENTS_LINK, EVENT_CONTRIBUTORS_LINK]);
  });

  it('hides IRL Gatherings from a member who is not an admin', () => {
    expect(linksFor(member)).toEqual([ALL_EVENTS_LINK, EVENT_CONTRIBUTORS_LINK]);
  });

  it('hides IRL Gatherings when no one is signed in', () => {
    expect(linksFor(null)).toEqual([ALL_EVENTS_LINK, EVENT_CONTRIBUTORS_LINK]);
  });
});
