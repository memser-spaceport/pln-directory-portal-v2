/**
 * LAB-2922: the teams list query is built in one place, so the server page that renders page 1 and the browser's
 * infinite list send the same query, and the string can tell the list whether the server's page is for its filters.
 */
import { buildTeamsListQuery } from '@/services/teams/teamsListQuery';

it('maps sort, investment focus and priorities the way the API expects', () => {
  const query = buildTeamsListQuery({
    searchBy: 'lab',
    sort: 'Name,Asc',
    investmentFocus: 'AI|DePIN|',
    priorities: '1|-1',
  } as never);

  expect(new URLSearchParams(query).toString()).toBe(
    new URLSearchParams(
      'searchBy=lab&sort=name:asc&investmentFocus[0]=AI&investmentFocus[1]=DePIN&priorities[0]=1&priorities[1]=99',
    ).toString(),
  );
});

it('is the same string for the same filters in the same (URL) order', () => {
  expect(buildTeamsListQuery({ searchBy: 'x', isFund: 'true' } as never)).toBe(
    buildTeamsListQuery({ searchBy: 'x', isFund: 'true' } as never),
  );
});

it('sends nothing extra for no filters', () => {
  expect(buildTeamsListQuery({} as never)).toBe('');
});
