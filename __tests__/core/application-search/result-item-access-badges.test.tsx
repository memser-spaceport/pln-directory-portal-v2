import { act, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/analytics/unified-search.analytics', () => ({
  useUnifiedSearchAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

import type { IUserInfo } from '@/types/shared.types';
import { useCurrentUserStore } from '@/services/auth/store';
import { SearchResultsItem } from '@/components/core/application-search/components/SearchResultsSection/components/SearchResultsItem';

const ADMIN = {
  uid: 'admin-1',
  rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
} as unknown as IUserInfo;

const INVESTOR = {
  uid: 'investor-1',
  rbac: { effectivePermissions: [{ code: 'member.profile.visible' }] },
} as unknown as IUserInfo;

function viewAs(user: IUserInfo | null) {
  act(() => useCurrentUserStore.getState().actions.setCurrentUser(user));
}

/* The core Tooltip renders its trigger twice (one copy per breakpoint). */
const isShown = (label: string) => screen.queryAllByText(label).length > 0;

const row = (fields: Record<string, unknown>) =>
  render(
    <ul>
      <SearchResultsItem item={{ uid: 'x-1', name: 'Horizon AutoDev', image: undefined, matches: [], ...fields } as any} />
    </ul>,
  );

describe('L0/L1 badges on header search results (LAB-3252)', () => {
  afterEach(() => viewAs(null));

  it.each([
    ['L1', 'L1 · Base level'],
    ['L0', 'L0 · Hidden'],
  ])('shows the %s team badge to an admin', (accessLevel, label) => {
    viewAs(ADMIN);
    row({ index: 'teams', accessLevel });

    expect(isShown(label)).toBe(true);
  });

  it.each([
    ['PENDING', 'L0 · Not approved'],
    ['VERIFIED', 'L1 · Limited access'],
  ])('shows the %s member badge to an admin', (memberState, label) => {
    viewAs(ADMIN);
    row({ index: 'members', memberState });

    expect(isShown(label)).toBe(true);
  });

  it('shows the Job Aspirant badge on a member result', () => {
    viewAs(ADMIN);
    row({ index: 'members', memberState: 'PENDING', isJobAspirant: true });

    expect(isShown('L0 · Not approved')).toBe(true);
    expect(isShown('Job Aspirant')).toBe(true);
  });

  it('shows no badge for an approved member or a team without a level', () => {
    viewAs(ADMIN);
    const { unmount } = row({ index: 'members', memberState: 'APPROVED' });
    expect(isShown('L0 · Not approved')).toBe(false);
    expect(isShown('L1 · Limited access')).toBe(false);
    unmount();

    row({ index: 'teams', accessLevel: null });
    expect(isShown('L1 · Base level')).toBe(false);
  });

  it.each([
    ['an investor', INVESTOR],
    ['a signed-out visitor', null],
  ])('shows no badge to %s', (_, viewer) => {
    viewAs(viewer);
    const { unmount } = row({ index: 'teams', accessLevel: 'L1' });
    expect(isShown('L1 · Base level')).toBe(false);
    unmount();

    row({ index: 'members', memberState: 'PENDING', isJobAspirant: true });
    expect(isShown('L0 · Not approved')).toBe(false);
    expect(isShown('Job Aspirant')).toBe(false);
  });

  it('shows no badge on a project result', () => {
    viewAs(ADMIN);
    row({ index: 'projects', accessLevel: 'L1' });

    expect(isShown('L1 · Base level')).toBe(false);
  });
});
