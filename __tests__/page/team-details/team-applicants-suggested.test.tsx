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
  MemberProfilePane: ({ memberUid, section }: any) => (
    <div data-testid="pane" data-member={memberUid}>
      {section}
    </div>
  ),
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

  it('offers Contact in place of a mailto: Email', async () => {
    renderView();
    await openSuggested();

    expect(screen.getByRole('button', { name: 'Contact Ana' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Email/ })).not.toBeInTheDocument();
    expect(analytics.onJobSuggestedCandidateContacted).not.toHaveBeenCalled();
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
 * LAB-2847: the lead switches the role's requirements on or off from the
 * "Why suggested" pane.
 */
describe('Edit criteria on the Suggested tab', () => {
  const CRITERIA: RoleCriterion[] = [
    { text: 'Five years of Rust', enabled: true },
    { text: 'Distributed systems experience', enabled: true },
    { text: 'Based in Europe', enabled: true },
  ];

  const openEditCriteria = async () => {
    renderView();
    await openSuggested();
    await userEvent.click(screen.getByRole('button', { name: 'Edit criteria' }));
  };

  it('offers Edit criteria when the backend sent the role’s criteria', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);

    renderView();
    await openSuggested();

    expect(screen.getByRole('button', { name: 'Edit criteria' })).toBeInTheDocument();
  });

  it('offers no Edit criteria on an older backend that sent none', async () => {
    setSuggestions([ANA, BEN], {}, null);

    renderView();
    await openSuggested();

    expect(screen.getByText('Led a Rust consensus rewrite.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit criteria' })).not.toBeInTheDocument();
  });

  it('offers no Edit criteria for a role with no criteria to switch', async () => {
    setSuggestions([ANA, BEN], {}, []);

    renderView();
    await openSuggested();

    expect(screen.getByText('Led a Rust consensus rewrite.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit criteria' })).not.toBeInTheDocument();
  });

  it('saves, closes and records the event with the on and off counts', async () => {
    setSuggestions([ANA, BEN], {}, CRITERIA);
    const saved = CRITERIA.map((c) => ({ ...c, enabled: c.text !== 'Based in Europe' }));
    saveCriteriaMutate.mockImplementation(answer({ data: saved }));

    await openEditCriteria();
    await userEvent.click(screen.getByRole('checkbox', { name: /^Based in Europe/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(saveCriteriaMutate).toHaveBeenCalledWith({ disabled: ['Based in Europe'] }, expect.anything());
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
      answer({ data: CRITERIA.map((c) => ({ ...c, enabled: c.text !== 'Based in Europe' })) }),
    );

    await openEditCriteria();
    await userEvent.click(screen.getByRole('checkbox', { name: /^Based in Europe/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(within(rowFor('Ben Ito')!).getByText('2 of 3 requirements')).toBeInTheDocument();
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
      /^Hi Ana, I lead hiring for Senior Rust Engineer at Filecoin Foundation\./,
    );
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

/** LAB-2847: the selected role's description, as plain text, on the Suggested tab. */
describe('the role description on the Suggested tab', () => {
  const renderWithRole = (role: IJobRole) =>
    render(
      <TeamApplicantsView
        teamId="team-1"
        teamName="Filecoin Foundation"
        roles={[role]}
        initialRoleUid={null}
        initialCandidateUid={null}
        viewerUid="u1"
        isLoggedIn
      />,
    );

  it('shows the posting as plain text with no markup', async () => {
    renderWithRole({
      ...ROLE,
      descriptionHtml:
        '<h2>About</h2><p>Build <strong>consensus</strong> &amp; storage in Rust.</p><ul><li>Remote</li></ul>',
    } as IJobRole);
    await openSuggested();

    const summary = screen.getByTestId('suggested-role-summary');
    expect(summary).toHaveTextContent('About Build consensus & storage in Rust. Remote');
    expect(summary.innerHTML).not.toMatch(/<|&lt;/);
    expect(summary.className).toMatch(/roleSummary/);
  });

  it('shows no description line for a role without one', async () => {
    renderWithRole({ ...ROLE, descriptionHtml: null } as IJobRole);
    await openSuggested();

    expect(screen.getByText(/People who worked at Filecoin Foundation are not suggested/)).toBeInTheDocument();
    expect(screen.queryByTestId('suggested-role-summary')).not.toBeInTheDocument();
  });

  it('is not shown on the Applied tab', () => {
    renderWithRole({ ...ROLE, descriptionHtml: '<p>Build consensus.</p>' } as IJobRole);

    expect(screen.queryByTestId('suggested-role-summary')).not.toBeInTheDocument();
  });
});
