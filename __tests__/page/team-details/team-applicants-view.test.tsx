import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * The flag is pinned rather than read: `.env.local` may set it and CI leaves it
 * blank, so a test that depended on the ambient value would pass here and flip
 * there. These assertions are about the view's own rules.
 */
jest.mock('@/services/jobs/constants', () => ({
  ...jest.requireActual('@/services/jobs/constants'),
  SHOW_TEAM_APPLICANTS: true,
}));

/* react-select is ESM-only and `transformIgnorePatterns` transpiles neither it
   nor anything else outside `geist`/`next/dist`, so it cannot render here at
   all. Stubbed to one button per option, which is enough to press a role. */
jest.mock('react-select', () => ({
  __esModule: true,
  default: ({ options, onChange }: any) => (
    <div data-testid="role-picker">
      {options.map((option: any) => (
        <button key={option.value} type="button" onClick={() => onChange(option)}>
          {option.label}
          {option.newCount > 0 ? ` ● ${option.newCount} new` : ''}
        </button>
      ))}
    </div>
  ),
}));

/* The real SearchInput debounces through `DebouncedInput`. What is under test
   is the view's filtering, not the debounce, and a timer in the middle of it
   only buys flakiness. */
jest.mock('@/components/common/filters/SearchInput', () => ({
  SearchInput: ({ value, onChange, placeholder }: any) => (
    <input
      aria-label={placeholder}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

/**
 * The pane is stubbed, and not only for speed.
 *
 * It composes the real member-profile sections, and `TeamsDetails` reaches
 * `next/server` through `EditTeamForm → useGetTeam → services/teams.service →
 * utils/team.utils` — which throws `ReferenceError: Request is not defined`
 * under jsdom and takes the whole suite's module load with it. The same reason
 * every apply-flow suite stubs `JobApplicationPane`.
 *
 * What is under test here is the list, the tabs, the search and the selection.
 * The pane's own behaviour belongs to the pane's own test.
 */
jest.mock('@/components/page/team-details/TeamApplicants/components/ApplicantPane', () => ({
  ApplicantPane: ({ applicant }: any) => <div data-testid="pane">{applicant.name}</div>,
}));

const useApplicantCounts = jest.fn();
const useRoleApplicants = jest.fn();
const markSeen = jest.fn();
const toggleReviewed = jest.fn();
jest.mock('@/services/jobs/hooks/useTeamApplicants', () => ({
  useApplicantCounts: (...args: unknown[]) => useApplicantCounts(...args),
  useRoleApplicants: (...args: unknown[]) => useRoleApplicants(...args),
  useMarkApplicantSeen: () => ({ mutate: markSeen }),
  useToggleApplicantReviewed: () => ({ mutate: toggleReviewed }),
}));

import { TeamApplicantsView } from '@/components/page/team-details/TeamApplicants';
import type { TeamApplicant } from '@/schema/team-applicants';
import type { IJobRole } from '@/types/jobs.types';

const role = (uid: string, roleTitle: string): IJobRole =>
  ({
    uid,
    roleTitle,
    roleCategory: 'Engineering',
    seniority: 'senior',
    location: ['Remote'],
    workMode: null,
    applyUrl: 'https://example.com/apply',
    lastUpdated: '2026-09-15T00:00:00.000Z',
    postedDate: '2026-09-15T00:00:00.000Z',
    detectionDate: null,
  }) as IJobRole;

const ROLES = [role('role-1', 'Senior Distributed Systems Engineer'), role('role-2', 'Developer Advocate')];

const person = (over: Partial<TeamApplicant> & { uid: string; name: string }): TeamApplicant => ({
  memberUid: `m-${over.uid}`,
  email: 'someone@example.com',
  profileUrl: 'https://directory.plnetwork.io/members/x',
  avatarUrl: null,
  headline: 'Protocol Engineer',
  currentCompany: 'Lattice Compute',
  location: 'Berlin, Germany',
  tags: [],
  createdAt: '2026-09-16T00:00:00.000Z',
  coverLetter: 'note',
  cv: null,
  unseen: false,
  reviewed: false,
  kind: 'application',
  ...over,
});

const DEVON = person({ uid: 'a1', name: 'Devon Park', unseen: true });
const LINA = person({ uid: 'a2', name: 'Lina Suarez', headline: 'Staff Engineer', currentCompany: 'Textile' });
const MAYA = person({ uid: 'i1', name: 'Maya Okonjo', kind: 'interest', coverLetter: null });

const setLists = (data: { applications: TeamApplicant[]; interests: TeamApplicant[] } | undefined, isPending = false) =>
  useRoleApplicants.mockReturnValue({ data, isPending });

const renderView = (props: Partial<React.ComponentProps<typeof TeamApplicantsView>> = {}) =>
  render(
    <TeamApplicantsView
      teamId="team-1"
      teamName="Filecoin Foundation"
      roles={ROLES}
      initialRoleUid={null}
      viewerUid="u1"
      isLoggedIn
      {...props}
    />,
  );

beforeEach(() => {
  useApplicantCounts.mockReset();
  useRoleApplicants.mockReset();
  markSeen.mockReset();
  toggleReviewed.mockReset();
  useApplicantCounts.mockReturnValue({
    data: [
      { roleUid: 'role-1', applicantCount: 2, interestCount: 1, newCount: 1, newestAvatars: [] },
      { roleUid: 'role-2', applicantCount: 0, interestCount: 0, newCount: 0, newestAvatars: [] },
    ],
  });
  setLists({ applications: [DEVON, LINA], interests: [MAYA] });
});

describe('TeamApplicantsView', () => {
  it('opens on the role the count line was pressed for, not the first one', () => {
    renderView({ initialRoleUid: 'role-2' });

    const picker = screen.getByTestId('role-picker');
    expect(within(picker).getByText(/Developer Advocate/)).toBeInTheDocument();
    /* The list head describes the chosen role, which is how the page says
       "these people answered this". */
    expect(useRoleApplicants).toHaveBeenLastCalledWith(expect.objectContaining({ roleUid: 'role-2' }));
  });

  it('keeps the two acts in separate tabs, because they are different acts', async () => {
    renderView();

    expect(screen.getByText('Devon Park')).toBeInTheDocument();
    expect(screen.queryByText('Maya Okonjo')).not.toBeInTheDocument();

    await userEvent.click(screen.getByText(/Interested/));

    expect(screen.getByText('Maya Okonjo')).toBeInTheDocument();
    expect(screen.queryByText('Devon Park')).not.toBeInTheDocument();
  });

  it('filters by name and by the role line', async () => {
    renderView();
    const search = screen.getByLabelText('Search by name or role');

    await userEvent.type(search, 'lina');
    expect(screen.queryByText('Devon Park')).not.toBeInTheDocument();
    expect(screen.getByText('Lina Suarez')).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, 'textile');
    expect(screen.getByText('Lina Suarez')).toBeInTheDocument();
    expect(screen.queryByText('Devon Park')).not.toBeInTheDocument();
  });

  it('marks an unopened person new, and leaves the opened ones plain', () => {
    renderView();

    const rows = screen.getAllByRole('button', { pressed: false });
    const devon = rows.find((row) => row.textContent?.includes('Devon Park'));
    const lina = rows.find((row) => row.textContent?.includes('Lina Suarez'));

    expect(devon?.textContent).toContain('New');
    expect(lina?.textContent).not.toContain('New');
  });

  it('shows the team its own tick on a reviewed row', () => {
    setLists({ applications: [person({ uid: 'a9', name: 'Steven Allen', reviewed: true })], interests: [] });
    renderView();

    expect(screen.getByLabelText('Reviewed')).toBeInTheDocument();
  });

  it('selects the row that was pressed', async () => {
    renderView();

    await userEvent.click(screen.getByText('Lina Suarez'));

    const pressed = screen.getByRole('button', { pressed: true });
    expect(pressed.textContent).toContain('Lina Suarez');
  });

  /* Four different nothings. One "No results" would make a team that has never
     posted a job look like a search that matched nobody. */
  describe('the empty states say which nothing this is', () => {
    it('a team with no postings is told to go and post one', () => {
      setLists({ applications: [], interests: [] });
      renderView({ roles: [] });

      expect(screen.getByText(/no open roles/i)).toBeInTheDocument();
    });

    it('a role nobody answered is waiting, not broken', () => {
      setLists({ applications: [], interests: [] });
      renderView();

      expect(screen.getByText(/No one has applied to this role yet/i)).toBeInTheDocument();
    });

    it('the Interested tab says nobody is interested, not nobody applied', async () => {
      setLists({ applications: [], interests: [] });
      renderView();

      await userEvent.click(screen.getByText(/Interested/));

      expect(screen.getByText(/No one has said they’re interested yet/i)).toBeInTheDocument();
    });

    it('a search that matched nothing names the term', async () => {
      renderView();

      await userEvent.type(screen.getByLabelText('Search by name or role'), 'zzzz');

      expect(screen.getByText(/zzzz/)).toBeInTheDocument();
      expect(screen.queryByText(/No one has applied/i)).not.toBeInTheDocument();
    });

    it('a list still loading is not empty', () => {
      setLists(undefined, true);
      renderView();

      expect(screen.getByText(/Loading/i)).toBeInTheDocument();
      expect(screen.queryByText(/No one has applied/i)).not.toBeInTheDocument();
    });
  });

  it('starts every query gated, so a session-less viewer never triggers a reload loop', () => {
    renderView({ viewerUid: undefined });

    expect(useApplicantCounts).toHaveBeenLastCalledWith(expect.objectContaining({ viewerUid: undefined }));
    expect(useRoleApplicants).toHaveBeenLastCalledWith(expect.objectContaining({ viewerUid: undefined }));
  });

  it('counts opening a row as reading it, and only for a row that was unread', async () => {
    renderView();

    await userEvent.click(screen.getByText('Devon Park'));
    expect(markSeen).toHaveBeenCalledWith({ kind: 'application', uid: 'a1' });

    markSeen.mockReset();
    await userEvent.click(screen.getByText('Lina Suarez'));
    expect(markSeen).not.toHaveBeenCalled();
  });

  it('steps to the next person, and stops at the ends', async () => {
    renderView();
    await userEvent.click(screen.getByText('Devon Park'));

    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous applicant' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Next applicant' }));

    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next applicant' })).toBeDisabled();
  });

  it('asks to mark reviewed', async () => {
    renderView();
    await userEvent.click(screen.getByText('Devon Park'));

    await userEvent.click(screen.getByRole('button', { name: /Mark as reviewed/ }));

    expect(toggleReviewed).toHaveBeenCalledWith({ kind: 'application', uid: 'a1', reviewed: true });
  });

  /* The undo is the button it turned into, which is why there is no confirm. */
  it('asks to unmark when the row is already reviewed', async () => {
    setLists({ applications: [{ ...DEVON, reviewed: true }], interests: [] });
    renderView();
    await userEvent.click(screen.getByText('Devon Park'));

    await userEvent.click(screen.getByRole('button', { name: 'Reviewed' }));

    expect(toggleReviewed).toHaveBeenCalledWith({ kind: 'application', uid: 'a1', reviewed: false });
  });

  it('writes a mail link naming the act, not just the role', async () => {
    renderView();
    await userEvent.click(screen.getByText('Devon Park'));

    expect(screen.getByRole('link', { name: /Email Devon/ })).toHaveAttribute(
      'href',
      'mailto:someone@example.com?subject=Your%20application%20for%20Senior%20Distributed%20Systems%20Engineer',
    );
  });

  /* A mail link with no address opens an empty compose window, which looks like
     the team has a way to reach this person when it does not. */
  it('offers no Email button for a member with no address', async () => {
    setLists({ applications: [person({ uid: 'a5', name: 'No Address', email: null })], interests: [] });
    renderView();
    await userEvent.click(screen.getByText('No Address'));

    expect(screen.queryByRole('link', { name: /Email/ })).not.toBeInTheDocument();
  });

  it('drops the selection and the search when the role changes', async () => {
    renderView();
    await userEvent.click(screen.getByText('Lina Suarez'));
    expect(screen.getByRole('button', { pressed: true })).toBeInTheDocument();

    await userEvent.click(within(screen.getByTestId('role-picker')).getByText(/Developer Advocate/));

    expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument();
  });
});
