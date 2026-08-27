import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useFormContext } from 'react-hook-form';

import { JobApplicationPane } from '@/components/page/jobs/JobApplicationPane/JobApplicationPane';
import type { IJobRole } from '@/types/jobs.types';
import type { IMember } from '@/types/members.types';

const mockUseTeamMembers = jest.fn();

jest.mock('@/prototypes/entries/job-board/components/ReferModal/hooks/useTeamMembers', () => ({
  useTeamMembers: (...args: unknown[]) => mockUseTeamMembers(...args),
}));

jest.mock('@/services/members/hooks/useMemberExperience', () => ({
  useMemberExperience: () => ({ data: [] }),
}));

/* The stub carries an `aria-label` the real one does not: production names the
   field with a `<label htmlFor="coverLetter">` in the pane, and this mock has no
   `id` for that label to reach. Same accessible name either way. */
jest.mock('@/components/form/FormTextArea/FormTextArea', () => ({
  FormTextArea: ({ name }: { name: string }) => {
    const { register } = useFormContext();
    return <textarea aria-label="Message for the team" {...register(name)} />;
  },
}));

jest.mock('@/prototypes/entries/job-board/components/ReferModal/components/MemberAvatar', () => ({
  MemberAvatar: ({ name }: { name: string }) => <span>{name}</span>,
}));

const role: IJobRole = {
  uid: 'role-1',
  roleTitle: 'Platform Lead',
  roleCategory: 'Engineering',
  seniority: null,
  location: [],
  workMode: null,
  applyUrl: null,
  lastUpdated: '2026-08-01T00:00:00.000Z',
  postedDate: '2026-08-01T00:00:00.000Z',
  detectionDate: null,
};

const member = {
  id: 'm1',
  name: 'Vova Horin',
  role: 'Lead',
  currentCompany: 'Exorde Labs',
  mainTeam: null,
  skills: [],
} as unknown as IMember;

const lead = { uid: 'lead-1', name: 'Juan Benet', title: 'Founder', team: 'Protocol Labs', image: null };

/**
 * The lead's name as it reaches the accessibility tree — with a NON-BREAKING
 * space, because `LeadNames` puts one there so a name cannot wrap across two
 * lines mid-person.
 *
 * It has to be a pattern rather than the string `'Juan Benet'`. `byRole` matches
 * the accessible name through an IDENTITY normalizer (unlike `byText`, which
 * collapses whitespace), so a plain space never matches U+00A0 — and the failure
 * is invisible, because the two render alike and the error message prints them
 * alike. `\s` matches both.
 */
const LEAD_NAME = /^Juan\s+Benet$/;

const renderPane = (teamId: string, teamName: string) =>
  render(
    <JobApplicationPane
      role={role}
      teamId={teamId}
      teamName={teamName}
      member={member}
      memberUid="m1"
      coverLetter=""
      onCoverLetterChange={jest.fn()}
      onEditProfile={jest.fn()}
      submitError={null}
    />,
  );

describe('JobApplicationPane hiring leads', () => {
  beforeEach(() => {
    mockUseTeamMembers.mockReturnValue({ defaultRecipients: [lead] });
  });

  it('names the hiring leads for any other team', () => {
    renderPane('team-1', 'Airship');

    expect(mockUseTeamMembers).toHaveBeenCalledWith('Airship', true);
    expect(screen.getByText(/Reviewed by/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: LEAD_NAME })).toBeInTheDocument();
  });

  /**
   * The ask is addressed, not generic.
   *
   * The invitation names the team twice, both from the `teamName` prop — the
   * point of the copy is that it is a message to someone in particular, so a
   * hardcoded "the team" would be the one way to get it wrong. Asserted on the
   * whole sentence rather than on the name alone, which appears in the step's
   * lede too and would pass against either.
   */
  it('invites a message to the team it names', () => {
    renderPane('team-1', 'Airship');

    expect(screen.getByText('Message for the team')).toBeInTheDocument();
    expect(screen.getByText(/Start a conversation with the team at Airship\./)).toBeInTheDocument();
    expect(screen.getByText(/why Airship interests you/)).toBeInTheDocument();
  });

  it('hides the hiring-lead line for Protocol Labs', () => {
    renderPane('cldvnyxaf01ynu21k62uopjvg', 'Protocol Labs');

    expect(mockUseTeamMembers).toHaveBeenCalledWith('Protocol Labs', false);
    expect(screen.queryByText(/Reviewed by/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: LEAD_NAME })).not.toBeInTheDocument();
  });
});
