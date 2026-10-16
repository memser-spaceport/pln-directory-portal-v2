import { render, screen, waitFor, within } from '@testing-library/react';
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

jest.mock('@/components/page/team-details/TeamApplicants/components/ApplicantPane', () => ({
  ApplicantPane: ({ applicant }: any) => <div data-testid="pane">{applicant.name}</div>,
  MemberProfilePane: ({ memberUid, section, officeHours = true }: any) => (
    <div data-testid="pane" data-member={memberUid} data-office-hours={String(officeHours)}>
      {section}
    </div>
  ),
}));

let isNarrow = false;
jest.mock('@/hooks/useIsBelowTabletLandscape', () => ({
  useIsBelowTabletLandscape: () => isNarrow,
}));

const routerReplace = jest.fn();
let search = 'role=role-1';
jest.mock('next/navigation', () => ({
  usePathname: () => '/teams/team-1/applicants',
  useRouter: () => ({ replace: routerReplace }),
  useSearchParams: () => new URLSearchParams(search),
}));

/* The lead as the Contact template introduces them (LAB-2853). Stubbed: the
   real hook reads the member endpoint. */
const useContactSender = jest.fn();
jest.mock('@/components/page/team-details/TeamApplicants/components/useContactSender', () => ({
  useContactSender: (...args: unknown[]) => useContactSender(...args),
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
  onJobSuggestedCriteriaEdited: jest.fn(),
};
jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => analytics,
}));

const toastError = jest.fn();
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: (...args: unknown[]) => toastError(...args), success: jest.fn(), info: jest.fn() },
}));

/* The two writes, scripted per test: each answers through the per-call
   callbacks the view passes, as React Query would once the server answered. */
type MutateOptions = { onSuccess?: (data: any) => void; onError?: (error: unknown) => void };
const saveCriteriaMutate = jest.fn();
const contactMutate = jest.fn();
const answer = (outcome: { data?: unknown; error?: unknown }) => (_vars: unknown, options?: MutateOptions) => {
  if (outcome.error) options?.onError?.(outcome.error);
  else options?.onSuccess?.(outcome.data);
};

jest.mock('@/services/jobs/hooks/useTeamApplicants', () => ({
  useApplicantCounts: () => ({ data: [] }),
  useRoleApplicants: (...args: unknown[]) => useRoleApplicants(...args),
  useMarkApplicantSeen: () => ({ mutate: jest.fn() }),
  useToggleApplicantReviewed: () => ({ mutate: jest.fn() }),
  useSuggestedCandidates: (...args: unknown[]) => useSuggestedCandidates(...args),
  useSaveMatchCriteria: () => ({ mutate: saveCriteriaMutate, isPending: false }),
  useContactSuggestedCandidate: () => ({ mutate: contactMutate, isPending: false }),
}));

import { TeamApplicantsView } from '@/components/page/team-details/TeamApplicants';
import { TeamApplicantsError } from '@/services/jobs/team-applicants.service';
import type { RoleCriterion, SuggestedCandidate } from '@/schema/suggested-candidates';
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

const setSuggestions = (
  data: SuggestedCandidate[] | undefined,
  extra: Record<string, unknown> = {},
  criteria: RoleCriterion[] | null = null,
) =>
  useSuggestedCandidates.mockReturnValue({
    data: data ? { suggestions: data, criteria } : undefined,
    isPending: !data,
    isError: false,
    ...extra,
  });

const renderView = (props: Partial<React.ComponentProps<typeof TeamApplicantsView>> = {}) =>
  render(
    <TeamApplicantsView
      teamId="team-1"
      teamName="Filecoin Foundation"
      roles={[ROLE]}
      initialRoleUid={null}
      initialCandidateUid={null}
      viewerUid="u1"
      isLoggedIn
      {...props}
    />,
  );

const openSuggested = () => userEvent.click(screen.getByText(/^Suggested/));
const rowFor = (name: string) =>
  screen.getAllByRole('button').find((b) => b.getAttribute('aria-pressed') !== null && b.textContent?.includes(name));

beforeEach(() => {
  isNarrow = false;
  search = 'role=role-1';
  useContactSender.mockReset();
  useContactSender.mockReturnValue({ name: 'Maya Chen', role: 'Head of Engineering' });
  routerReplace.mockReset();
  toastError.mockReset();
  saveCriteriaMutate.mockReset();
  contactMutate.mockReset();
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

  it('lists the people best match first, marking only a Strong match', async () => {
    renderView();
    await openSuggested();

    const ana = rowFor('Ana Lopez')!;
    const ben = rowFor('Ben Ito')!;
    expect(ana.compareDocumentPosition(ben) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(ana).getByText('Strong match')).toBeInTheDocument();
    // LAB-2837 feedback: a Good match carries no badge, on the row or anywhere.
    expect(within(ben).queryByText(/match/)).not.toBeInTheDocument();
    expect(screen.queryByText('Good match')).not.toBeInTheDocument();
    expect(screen.queryByText(/Weak match/)).not.toBeInTheDocument();
  });

  it('shows no band in the pane for a Good match', async () => {
    renderView();
    await openSuggested();
    await userEvent.click(rowFor('Ben Ito')!);

    expect(screen.getByRole('heading', { name: 'Why we suggested Ben' })).toBeInTheDocument();
    const pane = screen.getByTestId('pane');
    expect(within(pane).getByText('2 of 3 requirements')).toBeInTheDocument();
    expect(within(pane).queryByText(/match/)).not.toBeInTheDocument();
  });

  /* LAB-2837 feedback: name, role and the band — the count lives in the pane. */
  it('keeps the requirement count off the rows', async () => {
    renderView();
    await openSuggested();

    expect(within(rowFor('Ana Lopez')!).getByText('Protocol Engineer')).toBeInTheDocument();
    expect(within(rowFor('Ana Lopez')!).queryByText(/requirements/)).not.toBeInTheDocument();
    expect(within(rowFor('Ben Ito')!).queryByText(/requirements/)).not.toBeInTheDocument();
  });

  it('paints Strong match as the gradient pill, not a DS badge', async () => {
    renderView();
    await openSuggested();

    const strong = within(rowFor('Ana Lopez')!).getByText('Strong match');
    expect(strong.className).toMatch(/root/);
    expect(strong.className).not.toMatch(/success|brand/);
  });

  it('says when the person was contacted, and nothing for the rest', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 60_000).toISOString();
    setSuggestions([{ ...ANA, contactedAt: twoDaysAgo }, BEN]);

    renderView();
    await openSuggested();

    expect(within(rowFor('Ana Lopez')!).getByTestId('suggested-row-contacted')).toHaveTextContent(/^Contacted 2d ago$/);
    expect(within(rowFor('Ben Ito')!).queryByTestId('suggested-row-contacted')).not.toBeInTheDocument();
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

  /* LAB-2837 feedback: a suggested person has not reached out; Contact is the way to talk to them. */
  it('shows no Office Hours in the Suggested pane', async () => {
    renderView();
    await openSuggested();

    expect(screen.getByTestId('pane')).toHaveAttribute('data-office-hours', 'false');
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
      source: 'app',
      utm_content: null,
    });
  });

  /* LAB-2853: an arrival from one of the suggested-candidates emails. */
  it.each(['job_suggested_candidates_email', 'job_suggested_candidate_intro_email'])(
    'records the view as from email when utm_source is %s, with its utm_content',
    async (utmSource) => {
      search = `role=role-1&tab=suggested&utm_source=${utmSource}&utm_content=all_matches`;

      renderView({ initialRoleUid: 'role-1', initialTab: 'suggested' });

      await waitFor(() =>
        expect(analytics.onJobSuggestedCandidatesViewed).toHaveBeenCalledWith({
          team_id: 'team-1',
          job_id: 'role-1',
          count: 2,
          source: 'email',
          utm_content: 'all_matches',
        }),
      );
    },
  );

  it('counts only the first view as the email’s; another role after it is from the app', async () => {
    search = 'role=role-1&tab=suggested&utm_source=job_suggested_candidates_email&utm_content=all_matches';
    setLists({ applications: [], interests: [] });
    const ROLE_2 = { ...ROLE, uid: 'role-2', roleTitle: 'Developer Advocate' } as IJobRole;

    renderView({ roles: [ROLE, ROLE_2], initialRoleUid: 'role-1', initialTab: 'suggested' });
    await waitFor(() => expect(analytics.onJobSuggestedCandidatesViewed).toHaveBeenCalledTimes(1));
    await userEvent.click(within(screen.getByTestId('role-picker')).getByText(/Developer Advocate/));

    await waitFor(() => expect(analytics.onJobSuggestedCandidatesViewed).toHaveBeenCalledTimes(2));
    expect(analytics.onJobSuggestedCandidatesViewed).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ job_id: 'role-1', source: 'email', utm_content: 'all_matches' }),
    );
    expect(analytics.onJobSuggestedCandidatesViewed).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ job_id: 'role-2', source: 'app', utm_content: null }),
    );
  });

  it('records any other utm_source as from the app, keeping its utm_content', async () => {
    search = 'role=role-1&utm_source=job_application_email&utm_content=x';

    renderView({ initialTab: 'suggested' });

    await waitFor(() =>
      expect(analytics.onJobSuggestedCandidatesViewed).toHaveBeenCalledWith(
        expect.objectContaining({ source: 'app', utm_content: 'x' }),
      ),
    );
  });

  it('offers Contact in place of a mailto: Email', async () => {
    renderView();
    await openSuggested();

    expect(screen.getByRole('button', { name: 'Contact Ana' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Email/ })).not.toBeInTheDocument();
    expect(analytics.onJobSuggestedCandidateContacted).not.toHaveBeenCalled();
  });

  /* LAB-2837 feedback: the list is the way to move; the bar holds only Contact. */
  it('offers no previous / next or position in the Suggested bar', async () => {
    renderView();
    await openSuggested();

    expect(screen.getByRole('button', { name: 'Contact Ana' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous candidate' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next candidate' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+ of \d+$/)).not.toBeInTheDocument();
  });

  it('puts the selected suggestion in the URL so the link can be shared', async () => {
    renderView();
    await openSuggested();
    await userEvent.click(rowFor('Ben Ito')!);

    expect(routerReplace).toHaveBeenCalledWith('/teams/team-1/applicants?role=role-1&suggested=m-2', { scroll: false });
  });

  it('opens the Suggested tab on the member from a shared link', () => {
    render(
      <TeamApplicantsView
        teamId="team-1"
        teamName="Filecoin Foundation"
        roles={[ROLE]}
        initialRoleUid="role-1"
        initialCandidateUid={null}
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
 * LAB-2853: both live in the pane only; the row is name, role and count.
 */
describe('interested members on the Suggested tab', () => {
  const interested = (base: SuggestedCandidate, note?: string | null): SuggestedCandidate => ({
    ...base,
    interested: true,
    ...(note !== undefined ? { note } : {}),
  });

  it('shows neither the Interested mark nor the note in the row', async () => {
    setSuggestions([interested(ANA, 'Keen to work on consensus.'), interested(BEN)]);

    renderView();
    await openSuggested();

    for (const name of ['Ana Lopez', 'Ben Ito']) {
      const row = rowFor(name)!;
      expect(within(row).queryByText('Interested')).not.toBeInTheDocument();
      expect(within(row).queryByText('Keen to work on consensus.')).not.toBeInTheDocument();
    }
  });

  it('shows the mark and no note area in the pane when the interested member wrote no note', async () => {
    setSuggestions([interested(ANA, '   '), BEN]);

    renderView();
    await openSuggested();

    const pane = screen.getByTestId('pane');
    expect(within(pane).getByText('Interested')).toBeInTheDocument();
    expect(within(pane).queryByRole('blockquote')).not.toBeInTheDocument();
    expect(within(pane).queryByLabelText('Their note')).not.toBeInTheDocument();
  });

  it('shows no note in the pane for a suggestion that is not marked interested', async () => {
    setSuggestions([{ ...ANA, interested: false, note: 'A note the flag does not back.' }, BEN]);

    renderView();
    await openSuggested();

    expect(within(screen.getByTestId('pane')).queryByText('Interested')).not.toBeInTheDocument();
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
    contactMutate.mockImplementation(answer({ data: { contactedAt: '2026-10-13T10:00:00.000Z' } }));

    renderView();
    await openSuggested();
    await userEvent.click(screen.getByRole('button', { name: 'Contact Ana' }));
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(analytics.onJobSuggestedCandidateContacted).toHaveBeenCalledWith({
      team_id: 'team-1',
      job_id: 'role-1',
      rank: 1,
      label: 'Strong match',
      interested: true,
    });
  });
});

/**
 * LAB-2847: the lead switches the role's requirements on or off. The action
 * sits in the list column, not in the "Why suggested" pane: it changes the
 * role, not the person (LAB-2837 feedback). Since LAB-2904 it is an
 * "Edit AI criteria" button under the Suggested note, in the search's place.
 */
/** LAB-2904: Suggested lists the top five, so it has no search to narrow it. */
describe('Search on the Suggested tab', () => {
  it('shows no search field on Suggested', async () => {
    renderView();
    expect(screen.getByLabelText('Search by name or role')).toBeInTheDocument();

    await openSuggested();

    expect(screen.queryByLabelText('Search by name or role')).not.toBeInTheDocument();
    expect(rowFor('Ana Lopez')).toBeTruthy();
  });

  it('keeps the search on Applied and Interested', async () => {
    renderView();
    await openSuggested();

    await userEvent.click(screen.getByText(/^Interested/));
    expect(screen.getByLabelText('Search by name or role')).toBeInTheDocument();

    await userEvent.click(screen.getByText(/^Applied/));
    expect(screen.getByLabelText('Search by name or role')).toBeInTheDocument();
  });

  it('does not filter Suggested by a term typed on Applied', async () => {
    renderView();
    await userEvent.type(screen.getByLabelText('Search by name or role'), 'zzzz');

    await openSuggested();

    expect(rowFor('Ana Lopez')).toBeTruthy();
    expect(rowFor('Ben')).toBeTruthy();
  });
});

describe('Edit criteria on the Suggested tab', () => {
  const CRITERIA: RoleCriterion[] = [
    { text: 'Five years of Rust', enabled: true },
    { text: 'Distributed systems experience', enabled: true },
    { text: 'Based in Europe', enabled: true },
  ];

  const openEditCriteria = async () => {
    renderView();
    await openSuggested();
    await userEvent.click(screen.getByRole('button', { name: 'Edit AI criteria' }));
  };

  it('offers Edit AI criteria when the backend sent the role’s criteria', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);

    renderView();
    await openSuggested();

    expect(screen.getByRole('button', { name: 'Edit AI criteria' })).toBeInTheDocument();
  });

  it('puts Edit AI criteria under the role’s note, not in it and not in the person’s pane', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);

    renderView();
    await openSuggested();

    const note = screen.getByTestId('suggested-note');
    const button = screen.getByRole('button', { name: 'Edit AI criteria' });
    /* LAB-2904: a real button after the note, no text link at its end. */
    expect(note).not.toContainElement(button);
    expect(note).not.toHaveTextContent(/Edit criteria/);
    expect(note.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(button.compareDocumentPosition(rowFor('Ana Lopez')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The pane is open on Ana, so the move is the claim, not an empty pane.
    expect(screen.getByRole('heading', { name: 'Why we suggested Ana' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Edit AI criteria' })).toHaveLength(1);
  });

  it('offers Edit AI criteria when nobody is suggested, so a lead can loosen the role', async () => {
    setSuggestions([], {}, CRITERIA);

    renderView();
    await openSuggested();

    expect(screen.getByRole('button', { name: 'Edit AI criteria' })).toBeInTheDocument();
  });

  it('offers no Edit AI criteria on an older backend that sent none', async () => {
    setSuggestions([ANA, BEN], {}, null);

    renderView();
    await openSuggested();

    expect(screen.getByText('Led a Rust consensus rewrite.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit AI criteria' })).not.toBeInTheDocument();
  });

  it('offers no Edit AI criteria for a role with no criteria to switch', async () => {
    setSuggestions([ANA, BEN], {}, []);

    renderView();
    await openSuggested();

    expect(screen.getByText('Led a Rust consensus rewrite.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit AI criteria' })).not.toBeInTheDocument();
  });

  it('saves, closes and records the event with the on and off counts', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);
    const saved = CRITERIA.map((c) => ({ ...c, enabled: c.text !== 'Based in Europe' }));
    saveCriteriaMutate.mockImplementation(answer({ data: { criteria: saved, prompt: null } }));

    await openEditCriteria();
    await userEvent.click(screen.getByRole('checkbox', { name: /^Based in Europe/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveCriteriaMutate).toHaveBeenCalledWith({ disabled: ['Based in Europe'], prompt: null }, expect.anything());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(analytics.onJobSuggestedCriteriaEdited).toHaveBeenCalledWith({
      team_id: 'team-1',
      job_id: 'role-1',
      enabled_count: 2,
      disabled_count: 1,
    });
    expect(toastError).not.toHaveBeenCalled();
  });

  it('leaves the requirement counts alone after a save', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);
    saveCriteriaMutate.mockImplementation(
      answer({
        data: { criteria: CRITERIA.map((c) => ({ ...c, enabled: c.text !== 'Based in Europe' })), prompt: null },
      }),
    );

    await openEditCriteria();
    await userEvent.click(screen.getByRole('checkbox', { name: /^Based in Europe/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    // The pane, open on Ana, is the one place the count is shown now.
    expect(screen.getByText('3 of 3 requirements')).toBeInTheDocument();
  });

  it('toasts the server’s refusal, stays open on the draft and records nothing', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);
    saveCriteriaMutate.mockImplementation(answer({ error: new TeamApplicantsError(500, 'The matcher is busy') }));

    await openEditCriteria();
    await userEvent.click(screen.getByRole('checkbox', { name: /^Based in Europe/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(toastError).toHaveBeenCalledWith('The matcher is busy');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^Based in Europe/ })).toHaveAttribute('aria-checked', 'false');
    expect(analytics.onJobSuggestedCriteriaEdited).not.toHaveBeenCalled();
  });

  it('falls back to its own words when the failure carries none', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);
    saveCriteriaMutate.mockImplementation(answer({ error: new Error('') }));

    await openEditCriteria();
    await userEvent.click(screen.getByRole('checkbox', { name: /^Based in Europe/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(toastError).toHaveBeenCalledWith('Could not save the criteria. Please try again.');
  });

  /* LAB-2853: the lead's own words ride the same save. */
  it('opens on the saved prompt and saves it with the switches', async () => {
    setSuggestions([ANA, BEN], { data: { suggestions: [ANA, BEN], criteria: CRITERIA, criteriaPrompt: 'Old words' } });
    saveCriteriaMutate.mockImplementation(answer({ data: { criteria: CRITERIA, prompt: 'New words' } }));

    await openEditCriteria();
    const promptBox = screen.getByRole('textbox', {
      name: 'Help us suggest better members for Senior Rust Engineer.',
    });
    expect(promptBox).toHaveValue('Old words');
    await userEvent.clear(promptBox);
    await userEvent.type(promptBox, 'New words');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveCriteriaMutate).toHaveBeenCalledWith({ disabled: [], prompt: 'New words' }, expect.anything());
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

/**
 * LAB-2853: `?tab=suggested` opens the Suggested tab, and `?edit=criteria`
 * also opens Edit criteria once — the founder email's links.
 */
describe('URL params from the founder email', () => {
  const CRITERIA: RoleCriterion[] = [
    { text: 'Five years of Rust', enabled: true },
    { text: 'Based in Europe', enabled: true },
  ];
  let replaceState: jest.SpyInstance;

  beforeEach(() => {
    window.history.pushState({}, '', '/teams/team-1/applicants?role=role-1&tab=suggested&edit=criteria&utm_source=x');
    replaceState = jest.spyOn(window.history, 'replaceState');
  });

  afterEach(() => {
    replaceState.mockRestore();
    window.history.pushState({}, '', '/');
  });

  it('opens on the Suggested tab with tab=suggested, even when someone applied', () => {
    renderView({ initialRoleUid: 'role-1', initialTab: 'suggested' });

    expect(rowFor('Ana Lopez')).toBeTruthy();
    expect(rowFor('Devon Park')).toBeUndefined();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ignores a tab value it does not know', () => {
    renderView({ initialRoleUid: 'role-1', initialTab: 'bogus' });

    expect(rowFor('Devon Park')).toBeTruthy();
    expect(rowFor('Ana Lopez')).toBeUndefined();
  });

  it('opens Edit criteria once with edit=criteria, then drops edit from the URL without navigating', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);
    // The history entry as Next leaves it: its own `__NA` state.
    window.history.replaceState({ __NA: true }, '', window.location.href);
    replaceState.mockClear();

    renderView({ initialRoleUid: 'role-1', initialTab: 'suggested', initialEdit: 'criteria' });

    expect(await screen.findByRole('dialog', { name: 'Edit AI criteria' })).toBeInTheDocument();
    expect(rowFor('Ana Lopez')).toBeTruthy();
    expect(replaceState).toHaveBeenCalledTimes(1);
    /* LAB-2893: never hand Next its own state back. Next's patched replaceState
       ignores the URL for a `__NA` state, keeps `edit=criteria` in its router
       and writes it back later, so a reload reopened the modal. */
    expect((replaceState.mock.calls[0][0] as { __NA?: boolean } | null)?.__NA).toBeUndefined();
    expect(window.location.pathname + window.location.search).toBe(
      '/teams/team-1/applicants?role=role-1&tab=suggested&utm_source=x',
    );
    expect(routerReplace).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('waits for the criteria before opening Edit criteria', async () => {
    setSuggestions(undefined);
    const { rerender } = renderView({ initialRoleUid: 'role-1', initialEdit: 'criteria' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(replaceState).not.toHaveBeenCalled();

    setSuggestions([ANA, BEN], {}, CRITERIA);
    rerender(
      <TeamApplicantsView
        teamId="team-1"
        teamName="Filecoin Foundation"
        roles={[ROLE]}
        initialRoleUid="role-1"
        initialCandidateUid={null}
        initialEdit="criteria"
        viewerUid="u1"
        isLoggedIn
      />,
    );

    expect(await screen.findByRole('dialog', { name: 'Edit AI criteria' })).toBeInTheDocument();
    expect(rowFor('Ana Lopez')).toBeTruthy();
  });

  it('opens no modal when the role has no criteria to edit, and still drops edit from the URL', async () => {
    setSuggestions([ANA, BEN], {}, []);

    renderView({ initialRoleUid: 'role-1', initialTab: 'suggested', initialEdit: 'criteria' });

    await waitFor(() => expect(replaceState).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(window.location.search).not.toMatch(/edit=/);
    expect(rowFor('Ana Lopez')).toBeTruthy();
  });

  it('keeps a shared suggested= link working alongside tab=suggested', () => {
    renderView({ initialRoleUid: 'role-1', initialTab: 'suggested', initialSuggestedMemberUid: 'm-2' });

    expect(screen.getByTestId('pane')).toHaveAttribute('data-member', 'm-2');
  });
});

/**
 * LAB-2847: Contact sends a message through the platform, and the pane reads
 * "Contacted · <date>" from the server's `contactedAt` from then on.
 */
describe('Contact on the Suggested tab', () => {
  const openContact = async () => {
    renderView();
    await openSuggested();
    await userEvent.click(screen.getByRole('button', { name: 'Contact Ana' }));
  };

  it('opens on the prefilled message and records nothing for opening or closing', async () => {
    await openContact();

    expect(screen.getByRole('dialog', { name: 'Contact Ana' })).toBeInTheDocument();
    expect((screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement).value).toMatch(
      /^Hi Ana,\n\nI'm Maya, Head of Engineering at Filecoin Foundation\. I'm hiring for our Senior Rust Engineer role\./,
    );
    expect(screen.getByRole('link', { name: /Senior Rust Engineer/ })).toHaveAttribute('href', '/jobs/openings/role-1');
    expect(useContactSender).toHaveBeenLastCalledWith({
      viewerUid: 'u1',
      teamId: 'team-1',
      isLoggedIn: true,
      enabled: true,
    });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(contactMutate).not.toHaveBeenCalled();
    expect(analytics.onJobSuggestedCandidateContacted).not.toHaveBeenCalled();
  });

  it('sends the message for that person, closes, and records the contact', async () => {
    contactMutate.mockImplementation(answer({ data: { contactedAt: '2026-10-13T10:00:00.000Z' } }));

    await openContact();
    const field = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.clear(field);
    await userEvent.type(field, 'Hi Ana, fancy a chat?');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(contactMutate).toHaveBeenCalledWith(
      { memberUid: 'm-1', message: 'Hi Ana, fancy a chat?' },
      expect.anything(),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(analytics.onJobSuggestedCandidateContacted).toHaveBeenCalledWith({
      team_id: 'team-1',
      job_id: 'role-1',
      rank: 1,
      label: 'Strong match',
      interested: false,
    });
    expect(toastError).not.toHaveBeenCalled();
  });

  it('shows Contacted with the date from the read, after a reload, with no way to send again', async () => {
    setSuggestions([{ ...ANA, contactedAt: '2026-10-12T09:00:00.000Z' }, BEN]);

    renderView();
    await openSuggested();

    expect(screen.getByTestId('suggested-contacted')).toHaveTextContent(/^Contacted\s·\sOct 12, 2026$/);
    expect(screen.queryByRole('button', { name: /^Contact/ })).not.toBeInTheDocument();
  });

  it('treats a 409 as already contacted: closes, no toast, no event', async () => {
    contactMutate.mockImplementation(answer({ error: new TeamApplicantsError(409, 'Already contacted') }));

    await openContact();
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(toastError).not.toHaveBeenCalled();
    expect(analytics.onJobSuggestedCandidateContacted).not.toHaveBeenCalled();
  });

  it('toasts any other failure, stays open on the text, and still offers Contact', async () => {
    contactMutate.mockImplementation(answer({ error: new TeamApplicantsError(400, 'This member has no email') }));

    await openContact();
    const field = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.clear(field);
    await userEvent.type(field, 'My own words');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(toastError).toHaveBeenCalledWith('This member has no email');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('My own words');
    expect(analytics.onJobSuggestedCandidateContacted).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Contact Ana' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Contact Ana' }));
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue('My own words');
  });

  it('keeps Email on the Applied tab', async () => {
    renderView();

    expect(screen.getByRole('link', { name: /Email Devon/ })).toHaveAttribute(
      'href',
      expect.stringMatching(/^mailto:devon@example\.com/),
    );
    expect(screen.queryByRole('button', { name: /^Contact/ })).not.toBeInTheDocument();
  });

  it('keeps Email on the Interested tab', async () => {
    setLists({ applications: [], interests: [{ ...APPLICANT, uid: 'i1', kind: 'interest' }] });

    renderView();

    expect(screen.getByRole('link', { name: /Email Devon/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Contact/ })).not.toBeInTheDocument();
  });
});

/**
 * LAB-2853: the list head on every tab — the role's title, then the posting's
 * first paragraph as plain text. It replaced LAB-2847's Suggested-only summary.
 */
describe('the list head', () => {
  const renderWithRole = (role: IJobRole) => renderView({ roles: [role] });

  it('names the role in a heading on the Applied tab', () => {
    renderWithRole(ROLE);

    expect(screen.getByRole('heading', { level: 2, name: 'Senior Rust Engineer' })).toBeInTheDocument();
  });

  it('shows the posting’s first paragraph as plain text, with no markup', () => {
    renderWithRole({
      ...ROLE,
      descriptionHtml:
        '<p>Build <strong>consensus</strong> &amp; storage<br>in Rust.</p><p>Second paragraph.</p><ul><li>Remote</li></ul>',
    } as IJobRole);

    const lead = screen.getByTestId('role-description-lead');
    expect(lead).toHaveTextContent(/^Build consensus & storage in Rust\.$/);
    expect(lead.innerHTML).not.toMatch(/<|&lt;/);
    expect(lead.className).toMatch(/roleLead/);
  });

  it('skips empty paragraphs to the first one with text', () => {
    renderWithRole({ ...ROLE, descriptionHtml: '<p> </p><p></p><p>About the team.</p><p>More.</p>' } as IJobRole);

    expect(screen.getByTestId('role-description-lead')).toHaveTextContent(/^About the team\.$/);
  });

  it('keeps the same head on the Suggested tab', async () => {
    renderWithRole({ ...ROLE, descriptionHtml: '<p>Build consensus.</p>' } as IJobRole);
    await openSuggested();

    expect(screen.getByRole('heading', { level: 2, name: 'Senior Rust Engineer' })).toBeInTheDocument();
    expect(screen.getByTestId('role-description-lead')).toHaveTextContent('Build consensus.');
    expect(screen.getByText(/People who worked at Filecoin Foundation are not suggested/)).toBeInTheDocument();
  });

  it('shows no paragraph for a role without a description', () => {
    renderWithRole({ ...ROLE, descriptionHtml: null } as IJobRole);

    expect(screen.getByRole('heading', { level: 2, name: 'Senior Rust Engineer' })).toBeInTheDocument();
    expect(screen.queryByTestId('role-description-lead')).not.toBeInTheDocument();
  });
});
