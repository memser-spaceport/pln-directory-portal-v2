/**
 * LAB-2888 (jobs, members) and LAB-2922 (teams): the URL sync withholds its children until it has read the URL into
 * the filter store. It wraps the filter rail only, so the list itself is in the server HTML.
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// The sync before hydration, as on the server: it renders nothing of what it wraps.
jest.mock('@/components/page/jobs/JobsFilterUrlSync', () => ({ JobsFilterUrlSync: () => null }));
jest.mock('@/components/page/members/MembersFilterUrlSync', () => ({ MembersFilterUrlSync: () => null }));
jest.mock('@/components/page/teams/TeamsFilterUrlSync', () => ({ TeamsFilterUrlSync: () => null }));

import JobsLayout from '@/app/jobs/(jobs-page)/layout';
import MembersLayout from '@/app/members/(members-page)/layout';
import TeamsLayout from '@/app/teams/(teams-page)/layout';

it.each([
  ['jobs', JobsLayout],
  ['members', MembersLayout],
  ['teams', TeamsLayout],
])('the %s list renders while the URL sync still withholds the filter rail', (_name, Layout) => {
  render(<Layout filters={<p>Filter rail</p>} content={<p>The list</p>} />);

  expect(screen.getByText('The list')).toBeInTheDocument();
  expect(screen.queryByText('Filter rail')).not.toBeInTheDocument();
});
