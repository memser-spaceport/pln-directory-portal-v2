import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useFormContext } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';
import type { DirectoryMember } from '@/prototypes/entries/job-board/components/ReferModal/types';

const mockSend = jest.fn();
const mockUseTeamMembers = jest.fn();

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobReferModalOpened: jest.fn(),
    onJobReferModalCancelled: jest.fn(),
    onJobReferRefereeSelected: jest.fn(),
    onJobReferRecipientsChanged: jest.fn(),
    onJobReferNoteEdited: jest.fn(),
    onJobReferNoteReset: jest.fn(),
    onJobReferSubmitted: jest.fn(),
    onJobReferSucceeded: jest.fn(),
    onJobReferFailed: jest.fn(),
  }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { error: jest.fn() },
}));

jest.mock('@/components/common/Modal', () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));

jest.mock('@/components/form/FormTextArea/FormTextArea', () => ({
  FormTextArea: ({ name }: { name: string }) => {
    const { register } = useFormContext();
    return <textarea aria-label="Your note" {...register(name)} />;
  },
}));

jest.mock('@/prototypes/entries/job-board/components/ReferModal/hooks/useTeamMembers', () => ({
  useTeamMembers: (...args: unknown[]) => mockUseTeamMembers(...args),
}));

jest.mock('@/prototypes/entries/job-board/components/ReferModal/components/MemberSearchSelect', () => ({
  MemberSearchSelect: () => {
    const { setValue } = useFormContext();
    return (
      <button
        type="button"
        onClick={() =>
          setValue('referee', {
            value: 'm1',
            label: 'Ada Lovelace',
            originalObject: { uid: 'm1', name: 'Ada Lovelace', title: '', team: '', image: null },
          })
        }
      >
        Pick referee
      </button>
    );
  },
}));

jest.mock('@/prototypes/entries/job-board/components/ReferModal/components/RecipientPicker', () => ({
  RecipientPicker: ({ label, value, description }: { label: string; value: unknown[]; description?: string }) => (
    <div>
      <span>{label}</span>
      {description ? <span>{description}</span> : null}
      <span data-testid="recipient-count">{value.length}</span>
    </div>
  ),
}));

jest.mock('@/services/jobs/hooks/useJobReferral', () => ({
  useJobReferralDraft: () => ({ data: { note: 'Here is a draft.' }, isFetching: false, isError: false }),
  useCreateJobReferral: () => ({ mutate: mockSend, isPending: false }),
}));

import { ReferModal } from '@/prototypes/entries/job-board/components/ReferModal/ReferModal';

const role: IJobRole = {
  uid: 'role-1',
  roleTitle: 'Protocol Engineer',
  roleCategory: 'Engineering',
  seniority: 'senior',
  location: ['Remote'],
  workMode: 'remote',
  applyUrl: 'https://example.com/apply',
  lastUpdated: '2026-05-01T00:00:00.000Z',
  postedDate: '2026-05-01T00:00:00.000Z',
  detectionDate: null,
};

const lead: DirectoryMember = {
  uid: 'lead-1',
  name: 'Ana Ruiz',
  title: 'Staff Engineer',
  team: 'Acme',
  image: null,
  isTeamLead: true,
};

const renderModal = (jobReferEmail: string | null = null) =>
  render(
    <ReferModal
      open
      onClose={jest.fn()}
      role={role}
      teamId="team-1"
      teamName="Acme"
      source="job-board"
      jobReferEmail={jobReferEmail}
    />,
  );

describe('ReferModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTeamMembers.mockReturnValue({
      members: [lead],
      defaultRecipients: [lead],
      isLoading: false,
      isError: false,
    });
    mockSend.mockImplementation((_payload, opts) => {
      opts?.onSuccess?.({ uid: 'ref-1' });
    });
  });

  it('hides the member picker and skips the hiring-team fetch when a job-refer email is set', () => {
    renderModal('jobs@acme.com');

    expect(screen.queryByTestId('recipient-count')).not.toBeInTheDocument();
    expect(screen.getByText('Send to')).toBeInTheDocument();
    expect(
      screen.getByText('This referral will be sent to the email this team set up for job referrals.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Referral email will be sent to the address this team set up, and you’ll be copied.'),
    ).toBeInTheDocument();
    expect(mockUseTeamMembers).toHaveBeenCalledWith('Acme', false);
  });

  it('sends without recipients when a job-refer email is set', async () => {
    const user = userEvent.setup();
    renderModal('jobs@acme.com');

    await user.click(screen.getByRole('button', { name: 'Pick referee' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send referral' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Send referral' }));

    expect(mockSend).toHaveBeenCalledWith(
      { referredMemberUid: 'm1', note: 'Here is a draft.', recipients: [] },
      expect.any(Object),
    );
    expect(await screen.findByText('Referral sent')).toBeInTheDocument();
    expect(screen.getByText(/Your note is on its way to the team/)).toBeInTheDocument();
  });

  it('keeps member selection empty when the team has no job-refer email', () => {
    renderModal(null);

    expect(screen.getByText('Send to')).toBeInTheDocument();
    expect(screen.getByText('Search and select who from the Acme should receive this referral')).toBeInTheDocument();
    expect(mockUseTeamMembers).toHaveBeenCalledWith('Acme', true);
    expect(screen.getByTestId('recipient-count')).toHaveTextContent('0');
  });

  it('requires recipients when the team has no job-refer email', async () => {
    mockUseTeamMembers.mockReturnValue({
      members: [],
      defaultRecipients: [],
      isLoading: false,
      isError: false,
    });
    const user = userEvent.setup();
    renderModal(null);

    await user.click(screen.getByRole('button', { name: 'Pick referee' }));
    await waitFor(() => expect(screen.getByLabelText('Your note')).toHaveValue('Here is a draft.'));
    expect(screen.getByRole('button', { name: 'Send referral' })).toBeDisabled();
  });
});
