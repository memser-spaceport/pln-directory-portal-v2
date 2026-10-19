/**
 * @jest-environment node
 *
 * LAB-2888: the mobile filter bars read a filter store that is filled from the URL in the browser, so they stay
 * out of the server HTML (the list around them is server-rendered now) instead of showing "no filters" over a
 * filtered link.
 */
import { renderToString } from 'react-dom/server';

jest.mock('@/components/common/filters/MobileFilterWrapper', () => ({
  MobileFilterWrapper: () => <div>mobile filter bar</div>,
}));
jest.mock('@/analytics/jobs.analytics', () => ({ useJobsAnalytics: () => ({}) }));
jest.mock('@/services/jobs/hooks/useJobsQueries', () => ({ useInfiniteJobsList: () => ({ totalRoles: 0 }) }));
jest.mock('@/services/jobs/store', () => ({
  useJobsFilterStore: () => ({ params: new URLSearchParams(), setParam: jest.fn(), clearParams: jest.fn() }),
  useJobsFilterCount: () => 0,
}));
jest.mock('@/components/page/jobs/JobsFilterBody', () => ({ JobsFilterBody: () => null }));
jest.mock('@/analytics/members.analytics', () => ({ useMemberAnalytics: () => ({}) }));
jest.mock('@/services/members/store', () => ({
  useFilterStore: () => ({ params: new URLSearchParams(), setParam: jest.fn() }),
}));
jest.mock('@/components/page/members/hooks/useGetMembersFilterCount', () => ({ useGetMembersFilterCount: () => 0 }));
jest.mock('@/components/page/members/MembersFilter', () => ({ MembersFilter: () => null }));

import { useIsClient } from '@/hooks/useIsClient';
import JobsMobileFilters from '@/components/page/jobs/JobsMobileFilters';
import { MembersMobileFilters } from '@/components/page/members/MembersFilter/MembersMobileFilters';

function Probe() {
  return <span>{String(useIsClient())}</span>;
}

it('useIsClient is false on the server', () => {
  expect(renderToString(<Probe />)).toBe('<span>false</span>');
});

it.each([
  ['jobs', () => <JobsMobileFilters isLoggedIn={false} />],
  ['members', () => <MembersMobileFilters isUserLoggedIn={false} />],
])('the %s mobile filter bar renders nothing on the server', (_name, Bar) => {
  expect(renderToString(<Bar />)).toBe('');
});
