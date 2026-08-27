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

jest.mock('@/components/form/FormTextArea/FormTextArea', () => ({
  FormTextArea: ({ name }: { name: string }) => {
    const { register } = useFormContext();
    return <textarea aria-label="Cover letter" {...register(name)} />;
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
    expect(screen.getByRole('link', { name: 'Juan Benet' })).toBeInTheDocument();
  });

  it('hides the hiring-lead line for Protocol Labs', () => {
    renderPane('cldvnyxaf01ynu21k62uopjvg', 'Protocol Labs');

    expect(mockUseTeamMembers).toHaveBeenCalledWith('Protocol Labs', false);
    expect(screen.queryByText(/Reviewed by/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Juan Benet' })).not.toBeInTheDocument();
  });
});
