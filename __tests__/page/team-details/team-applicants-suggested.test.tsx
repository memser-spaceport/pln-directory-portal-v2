import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * LAB-2771: the Suggested tab on a team's Candidates page — the top matches
 * the product proposes for a live role, read-only.
 *
 * Mocks follow `team-applicants-view.test.tsx` (and for the same reasons): the
 * flag is pinned, react-select and the debounced search are stubbed, and the
 * profile half of the pane is stubbed because its sections reach `next/server`
 * under jsdom. The pane's own section — Why suggested — renders for real.
 */
jest.mock('@/services/jobs/constants', () => ({
  ...jest.requireActual('@/services/jobs/constants'),
  SHOW_TEAM_APPLICANTS: true,
}));

jest.mock('react-select', () => ({
  __esModule: true,
  default: ({ options, onChange }: any) => (
    <div data-testid="role-picker">
      {options.map((option: any) => (
        <button key={option.value} type="button" onClick={() => onChange(option)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

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

let memberEmail: string | null = 'ana@example.com';
jest.mock('@/components/page/team-details/TeamApplicants/components/ApplicantPane', () => ({
  ApplicantPane: ({ applicant }: any) => <div data-testid="pane">{applicant.name}</div>,
  MemberProfilePane: ({ memberUid, section }: any) => (
    <div data-testid="pane" data-member={memberUid}>
      {section}
    </div>
  ),
  useCandidateMember: () => ({ data: { email: memberEmail } }),
}));

let isNarrow = false;
jest.mock('@/hooks/useIsBelowTabletLandscape', () => ({
  useIsBelowTabletLandscape: () => isNarrow,
}));

const routerReplace = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => '/teams/team-1/applicants',
  useRouter: () => ({ replace: routerReplace }),
  useSearchParams: () => new URLSearchParams('role=role-1'),
}));

const useSuggestedCandidates = jest.fn();
const useRoleApplicants = jest.fn();
const analytics = {
  onJobHiringViewed: jest.fn(),
  onJobApplicantOpened: jest.fn(),
  onJobApplicantReviewed: jest.fn(),
  onJobApplicantReviewUndone: jest.fn(),
  onJobApplicantReviewFailed: jest.fn(),
  onJobApplicantEmailClicked: jest.fn(),
  onJobHiringTabChanged: jest.fn(),
  onJobSuggestedCandidatesViewed: jest.fn(),
  onJobSuggestedCandidateOpened: jest.fn(),
  onJobSuggestedCandidateContacted: jest.fn(),
};
jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => analytics,
}));

jest.mock('@/services/jobs/hooks/useTeamApplicants', () => ({
  useApplicantCounts: () => ({ data: [] }),
  useRoleApplicants: (...args: unknown[]) => useRoleApplicants(...args),
  useMarkApplicantSeen: () => ({ mutate: jest.fn() }),
  useToggleApplicantReviewed: () => ({ mutate: jest.fn() }),
  useSuggestedCandidates: (...args: unknown[]) => useSuggestedCandidates(...args),
}));

import { TeamApplicantsView } from '@/components/page/team-details/TeamApplicants';
import type { SuggestedCandidate } from '@/schema/suggested-candidates';
import type { TeamApplicant } from '@/schema/team-applicants';
import type { IJobRole } from '@/types/jobs.types';

const ROLE = {
  uid: 'role-1',
  roleTitle: 'Senior Rust Engineer',
  roleCategory: 'Engineering',
  seniority: 'senior',
  location: ['Remote'],
  workMode: null,
  applyUrl: null,
  lastUpdated: '2026-09-15T00:00:00.000Z',
  postedDate: '2026-09-15T00:00:00.000Z',
  detectionDate: null,
} as unknown as IJobRole;

const suggestion = (rank: number, name: string, label: SuggestedCandidate['label']): SuggestedCandidate => ({
  memberUid: `m-${rank}`,
  name,
  role: 'Protocol Engineer',
  imageUrl: null,
  fit: label === 'Strong match' ? 90 : 60,
  label,
  rank,
  blurb: rank === 1 ? 'Led a Rust consensus rewrite.' : null,
  criteria: [
    { text: 'Five years of Rust', matched: true },
    { text: 'Distributed systems experience', matched: true },
    { text: 'Based in Europe', matched: rank === 1 },
  ],
});

const ANA = suggestion(1, 'Ana Lopez', 'Strong match');
const BEN = suggestion(2, 'Ben Ito', 'Good match');

const APPLICANT: TeamApplicant = {
  uid: 'a1',
  memberUid: 'm-a1',
  kind: 'application',
  name: 'Devon Park',
  email: 'devon@example.com',
  profileUrl: 'https://directory.plnetwork.io/members/devon',
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
};

const setLists = (data: { applications: TeamApplicant[]; interests: TeamApplicant[] } | undefined) =>
  useRoleApplicants.mockReturnValue({ data, isPending: !data });

const setSuggestions = (data: SuggestedCandidate[] | undefined, extra: Record<string, unknown> = {}) =>
  useSuggestedCandidates.mockReturnValue({ data, isPending: !data, isError: false, ...extra });

const renderView = () =>
  render(
    <TeamApplicantsView
      teamId="team-1"
      teamName="Filecoin Foundation"
      roles={[ROLE]}
      initialRoleUid={null}
      initialCandidateUid={null}
      viewerUid="u1"
      isLoggedIn
    />,
  );

const openSuggested = () => userEvent.click(screen.getByText(/^Suggested/));
const rowFor = (name: string) =>
  screen.getAllByRole('button').find((b) => b.getAttribute('aria-pressed') !== null && b.textContent?.includes(name));

beforeEach(() => {
  isNarrow = false;
  memberEmail = 'ana@example.com';
  routerReplace.mockReset();
  Object.values(analytics).forEach((fn) => fn.mockReset());
  useSuggestedCandidates.mockReset();
  useRoleApplicants.mockReset();
  setSuggestions([ANA, BEN]);
  setLists({ applications: [APPLICANT], interests: [] });
});

describe('the Suggested tab', () => {
  it('sits next to Applied and Interested', () => {
    setLists({ applications: [], interests: [] });

    renderView();

    const labels = screen
      .getAllByText(/^(Applied|Interested|Suggested)/)
      .map((el) => el.textContent?.match(/^[A-Za-z]+/)?.[0]);
    expect(labels).toEqual(['Applied', 'Interested', 'Suggested']);
  });

  it('asks for the selected role’s suggestions, gated like the other reads', () => {
    renderView();

    expect(useSuggestedCandidates).toHaveBeenCalledWith({ roleUid: 'role-1', viewerUid: 'u1', enabled: true });
  });

  it('is not the tab the page opens on when someone applied', () => {
    renderView();

    expect(rowFor('Ana Lopez')).toBeUndefined();
  });

  /* A count line that says "2 suggested" must not lead to a page that opens on
     "No one has applied to this role yet." */
  it('is the tab the page opens on when nobody applied or is interested', () => {
    setLists({ applications: [], interests: [] });

    renderView();

    expect(rowFor('Ana Lopez')).toBeTruthy();
    expect(screen.queryByText(/No one has applied to this role yet/)).not.toBeInTheDocument();
  });

  it('waits for the applicants before deciding it is the only answer', () => {
    setLists(undefined);

    renderView();

    expect(rowFor('Ana Lopez')).toBeUndefined();
  });

  it('lists the people best match first, each with a Strong match or Good match label', async () => {
    renderView();
    await openSuggested();

    const ana = rowFor('Ana Lopez')!;
    const ben = rowFor('Ben Ito')!;
    expect(ana.compareDocumentPosition(ben) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(ana).getByText('Strong match')).toBeInTheDocument();
    expect(within(ben).getByText('Good match')).toBeInTheDocument();
    expect(within(ben).getByText('2 of 3 requirements')).toBeInTheDocument();
    expect(screen.queryByText(/Weak match/)).not.toBeInTheDocument();
  });

  it('says why the people the team knows are missing', async () => {
    renderView();
    await openSuggested();

    expect(screen.getByText(/People who worked at Filecoin Foundation are not suggested/)).toBeInTheDocument();
  });

  it('shows the selected person’s profile with each of the role’s criteria marked met or not met', async () => {
    renderView();
    await openSuggested();
    await userEvent.click(rowFor('Ben Ito')!);

    const pane = screen.getByTestId('pane');
    expect(pane).toHaveAttribute('data-member', 'm-2');
    const items = within(pane).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Five years of Rust — met',
      'Distributed systems experience — met',
      'Based in Europe — not metNot on their profile',
    ]);
    expect(analytics.onJobSuggestedCandidateOpened).toHaveBeenLastCalledWith({
      team_id: 'team-1',
      job_id: 'role-1',
      rank: 2,
      label: 'Good match',
    });
  });

  it('opens on the best match in the two-column layout', async () => {
    renderView();
    await openSuggested();

    expect(screen.getByTestId('pane')).toHaveAttribute('data-member', 'm-1');
    expect(screen.getByText('Led a Rust consensus rewrite.')).toBeInTheDocument();
  });

  it('does not count the page’s own preselect as the lead opening someone', async () => {
    renderView();
    await openSuggested();

    expect(analytics.onJobSuggestedCandidateOpened).not.toHaveBeenCalled();
  });

  it('shows an empty state for a role with no suggestions', async () => {
    setSuggestions([]);

    renderView();
    await openSuggested();

    expect(screen.getByText('No one to suggest for this role yet.')).toBeInTheDocument();
  });

  it('says so when the suggestions could not be loaded', async () => {
    setSuggestions(undefined, { isPending: false, isError: true });

    renderView();
    await openSuggested();

    expect(screen.getByText(/Suggested candidates could not be loaded/)).toBeInTheDocument();
  });

  it('records the tab view once, with how many people it showed', async () => {
    renderView();
    await openSuggested();

    expect(analytics.onJobHiringTabChanged).toHaveBeenCalledWith({
      team_id: 'team-1',
      job_id: 'role-1',
      tab: 'suggested',
    });
    expect(analytics.onJobSuggestedCandidatesViewed).toHaveBeenCalledTimes(1);
    expect(analytics.onJobSuggestedCandidatesViewed).toHaveBeenCalledWith({
      team_id: 'team-1',
      job_id: 'role-1',
      count: 2,
    });
  });

  it('records a contact when the lead emails a suggested person', async () => {
    renderView();
    await openSuggested();

    const email = screen.getByRole('link', { name: /Email Ana/ });
    expect(email).toHaveAttribute('href', expect.stringMatching(/^mailto:ana@example\.com\?subject=/));
    await userEvent.click(email);

    expect(analytics.onJobSuggestedCandidateContacted).toHaveBeenCalledWith({
      team_id: 'team-1',
      job_id: 'role-1',
      rank: 1,
      label: 'Strong match',
      interested: false,
    });
  });

  it('offers no Email press when the profile has no address', async () => {
    memberEmail = null;

    renderView();
    await openSuggested();

    expect(screen.queryByRole('link', { name: /Email/ })).not.toBeInTheDocument();
  });

  it('steps to the next suggested person', async () => {
    renderView();
    await openSuggested();
    await userEvent.click(screen.getByRole('button', { name: 'Next candidate' }));

    expect(screen.getByTestId('pane')).toHaveAttribute('data-member', 'm-2');
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
  });

  it('puts the selected suggestion in the URL so the link can be shared', async () => {
    renderView();
    await openSuggested();
    await userEvent.click(rowFor('Ben Ito')!);

    expect(routerReplace).toHaveBeenCalledWith(
      '/teams/team-1/applicants?role=role-1&suggested=m-2',
      { scroll: false },
    );
  });

  it('opens the Suggested tab on the member from a shared link', () => {
    render(
      <TeamApplicantsView
        teamId="team-1"
        teamName="Filecoin Foundation"
        roles={[ROLE]}
        initialRoleUid="role-1"
        initialSuggestedMemberUid="m-2"
        viewerUid="u1"
        isLoggedIn
      />,
    );

    expect(screen.getByTestId('pane')).toHaveAttribute('data-member', 'm-2');
    expect(rowFor('Ben Ito')).toHaveAttribute('aria-pressed', 'true');
  });
});

/**
 * LAB-2789: a suggestion from a member who said "I'm interested" (the flag
 * from LAB-2788) carries an Interested mark, and their note when they wrote one.
 */
describe('interested members on the Suggested tab', () => {
  const interested = (base: SuggestedCandidate, note?: string | null): SuggestedCandidate => ({
    ...base,
    interested: true,
    ...(note !== undefined ? { note } : {}),
  });

  it('marks an interested suggestion as Interested, in the design system tag style', async () => {
    setSuggestions([interested(ANA, 'Keen to work on consensus.'), BEN]);

    renderView();
    await openSuggested();

    const mark = within(rowFor('Ana Lopez')!).getByText('Interested');
    expect(mark.className).toMatch(/default/);
  });

  it('shows the interested member’s note in the row', async () => {
    setSuggestions([interested(ANA, 'Keen to work on consensus.'), BEN]);

    renderView();
    await openSuggested();

    expect(within(rowFor('Ana Lopez')!).getByText('Keen to work on consensus.')).toBeInTheDocument();
  });

  it('shows the mark and no note area when the interested member wrote no note', async () => {
    setSuggestions([interested(ANA), interested(BEN, '   ')]);

    renderView();
    await openSuggested();

    for (const name of ['Ana Lopez', 'Ben Ito']) {
      const row = rowFor(name)!;
      expect(within(row).getByText('Interested')).toBeInTheDocument();
      expect(within(row).queryByTestId('suggested-interest-note')).not.toBeInTheDocument();
    }
  });

  it('shows no mark and no note for a suggestion that is not marked interested', async () => {
    setSuggestions([ANA, { ...BEN, interested: false, note: 'A note the flag does not back.' }]);

    renderView();
    await openSuggested();

    for (const name of ['Ana Lopez', 'Ben Ito']) {
      const row = rowFor(name)!;
      expect(within(row).queryByText('Interested')).not.toBeInTheDocument();
      expect(within(row).queryByTestId('suggested-interest-note')).not.toBeInTheDocument();
    }
    expect(screen.queryByText('A note the flag does not back.')).not.toBeInTheDocument();
  });

  it('shows the whole note in the pane for the selected interested member', async () => {
    setSuggestions([interested(ANA, 'Keen to work on consensus.'), BEN]);

    renderView();
    await openSuggested();

    const pane = screen.getByTestId('pane');
    expect(within(pane).getByText('Keen to work on consensus.')).toBeInTheDocument();
    expect(within(pane).getByText('Interested')).toBeInTheDocument();
  });

  it('records whether the contacted member was interested', async () => {
    setSuggestions([interested(ANA), BEN]);

    renderView();
    await openSuggested();
    await userEvent.click(screen.getByRole('link', { name: /Email Ana/ }));

    expect(analytics.onJobSuggestedCandidateContacted).toHaveBeenCalledWith({
      team_id: 'team-1',
      job_id: 'role-1',
      rank: 1,
      label: 'Strong match',
      interested: true,
    });
  });
});
