import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The candidate pane — the person as the directory shows them, with what they
 * sent underneath (LAB-2713).
 *
 * Three rules are pinned here, each the answer to a section that used to draw
 * for people it did not apply to:
 *
 * - an interest press with no note draws NO description block at all, not a
 *   sentence explaining the absence; one with a note quotes it;
 * - Office Hours is withheld from a Job Aspirant (not a PL member, no office
 *   hours to book);
 * - Teams is withheld when the member has none.
 *
 * And the control: a PL member with everything filled in sees every section
 * exactly as before.
 *
 * The profile sections are stubbed because `TeamsDetails` reaches `next/server`
 * through `EditTeamForm → useGetTeam → services/teams.service`, which throws
 * `ReferenceError: Request is not defined` under jsdom (the reason the view test
 * stubs this whole pane). What is under test is which sections the pane mounts,
 * not what they draw.
 */

let mockMember: Record<string, unknown> | undefined;
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: () => ({ data: mockMember, isLoading: false, isError: false }),
}));

jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: () => ({ currentUser: { uid: 'lead-1' } }),
}));

jest.mock('@/services/members/hooks/useStoredCv', () => ({
  useStoredCv: () => ({ data: undefined }),
}));

jest.mock('@/components/common/profile/StoredCv', () => ({
  CvAttachmentLine: ({ cv }: any) => <span>{cv.fileName}</span>,
}));
jest.mock('@/components/common/profile/StoredCv/CvPreviewModal', () => ({
  CvPreviewModal: () => null,
}));

/* A function declaration, not a `const`: the mock factories below are hoisted
   above it and would otherwise reach it before it is initialised. */
function mockSection(id: string) {
  const Section = () => <div data-testid={id} />;
  Section.displayName = id;
  return Section;
}
jest.mock('@/components/page/member-details/ProfileDetails', () => ({
  ProfileDetails: mockSection('profile-details'),
}));
jest.mock('@/components/page/member-details/OfficeHoursDetails', () => ({
  OfficeHoursDetails: mockSection('office-hours'),
}));
jest.mock('@/components/page/member-details/ContactDetails', () => ({
  ContactDetails: mockSection('contact-details'),
}));
jest.mock('@/components/page/member-details/TeamsDetails', () => ({ TeamsDetails: mockSection('teams') }));
jest.mock('@/components/page/member-details/ExperienceDetails', () => ({
  ExperienceDetails: mockSection('experience'),
}));
jest.mock('@/components/page/member-details/ContributionsDetails', () => ({
  ContributionsDetails: mockSection('contributions'),
}));
jest.mock('@/components/page/member-details/RepositoriesDetails', () => ({
  RepositoriesDetails: mockSection('repositories'),
}));

import { ApplicantPane } from '@/components/page/team-details/TeamApplicants/components/ApplicantPane';
import { JOB_ASPIRANT_POLICY_CODE } from '@/services/jobs/job-board-viewer';
import type { TeamApplicant } from '@/schema/team-applicants';

const PL_MEMBER = {
  id: 'm-1',
  name: 'Devon Park',
  teams: [{ id: 't-1', name: 'Lattice Compute' }],
  mainTeam: { id: 't-1', name: 'Lattice Compute' },
  officeHours: 'https://cal.example.com/devon',
  rbac: { status: 'APPROVED', policies: [] },
};

const JOB_ASPIRANT = {
  id: 'm-2',
  name: 'Amara Nwosu',
  teams: [],
  mainTeam: null,
  rbac: { status: 'APPROVED', policies: [{ code: JOB_ASPIRANT_POLICY_CODE }] },
};

const row = (overrides: Partial<TeamApplicant> = {}): TeamApplicant => ({
  uid: 'int-1',
  kind: 'interest',
  memberUid: 'm-2',
  name: 'Amara Nwosu',
  email: null,
  profileUrl: 'https://directory.plnetwork.io/members/m-2',
  avatarUrl: null,
  headline: 'Backend Engineer',
  currentCompany: null,
  location: null,
  tags: [],
  createdAt: new Date().toISOString(),
  coverLetter: null,
  cv: null,
  unseen: false,
  reviewed: false,
  ...overrides,
});

const renderPane = (applicant: TeamApplicant, member: Record<string, unknown>) => {
  mockMember = member;
  return render(<ApplicantPane applicant={applicant} isLoggedIn />);
};

const NO_MESSAGE_COPY = /this signal carries no message/i;
const APPLIED_WITHOUT_NOTE = /applied without a note/i;

describe('the Interest section', () => {
  it('draws no description block when the press carried no note', () => {
    renderPane(row(), JOB_ASPIRANT);

    expect(screen.getByText('Interest')).toBeInTheDocument();
    expect(screen.queryByText(NO_MESSAGE_COPY)).not.toBeInTheDocument();
    expect(screen.queryByText(APPLIED_WITHOUT_NOTE)).not.toBeInTheDocument();
  });

  it('quotes the note when the candidate left one', () => {
    renderPane(row({ note: 'Six years on distributed storage; happy to talk through the Rust side.' }), JOB_ASPIRANT);

    expect(
      screen.getByText('Six years on distributed storage; happy to talk through the Rust side.'),
    ).toBeInTheDocument();
    expect(screen.queryByText(NO_MESSAGE_COPY)).not.toBeInTheDocument();
  });

  /* The server stores a blank note as no note; the pane does not draw an empty
     quote if one ever slips through. */
  it('treats an empty note as no note', () => {
    renderPane(row({ note: '' }), JOB_ASPIRANT);

    expect(screen.queryByText(NO_MESSAGE_COPY)).not.toBeInTheDocument();
    expect(screen.getByText('Interest')).toBeInTheDocument();
  });

  it('still says so when an application came without a letter', () => {
    renderPane(row({ kind: 'application', uid: 'app-1', coverLetter: null }), PL_MEMBER);

    expect(screen.getByText('Application')).toBeInTheDocument();
    expect(screen.getByText(APPLIED_WITHOUT_NOTE)).toBeInTheDocument();
  });
});

describe('the profile sections', () => {
  it('withholds Office Hours from a Job Aspirant', () => {
    renderPane(row(), JOB_ASPIRANT);

    expect(screen.queryByTestId('office-hours')).not.toBeInTheDocument();
    expect(screen.getByTestId('profile-details')).toBeInTheDocument();
    expect(screen.getByTestId('contact-details')).toBeInTheDocument();
  });

  it('withholds Teams when the member has none', () => {
    renderPane(row(), JOB_ASPIRANT);

    expect(screen.queryByTestId('teams')).not.toBeInTheDocument();
  });

  /* The rule is "no data, no section", not "aspirant, no section": a PL member
     with no team gets the same treatment. */
  it('withholds Teams from a PL member with no team, and keeps their Office Hours', () => {
    renderPane(row({ kind: 'application', uid: 'app-2' }), { ...PL_MEMBER, teams: [] });

    expect(screen.queryByTestId('teams')).not.toBeInTheDocument();
    expect(screen.getByTestId('office-hours')).toBeInTheDocument();
  });

  it('changes nothing for a PL member with these fields filled in', () => {
    renderPane(row({ kind: 'application', uid: 'app-3', coverLetter: 'I led the consensus rewrite.' }), PL_MEMBER);

    for (const id of [
      'profile-details',
      'office-hours',
      'contact-details',
      'teams',
      'experience',
      'contributions',
      'repositories',
    ]) {
      expect(screen.getByTestId(id)).toBeInTheDocument();
    }
    expect(screen.getByText('I led the consensus rewrite.')).toBeInTheDocument();
  });
});
