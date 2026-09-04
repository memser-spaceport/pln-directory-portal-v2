import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useFormContext } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';
import type { DirectoryMember } from '@/prototypes/entries/job-board/components/ReferModal/types';

const mockSend = jest.fn();
const mockUseTeamMembers = jest.fn();
const mockUseDraft = jest.fn();

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

// `disabled` is carried through deliberately: the modal disables the box until a
// draft lands, and a mock that swallowed the prop would let "still writable"
// assertions pass without the component ever agreeing.
jest.mock('@/components/form/FormTextArea/FormTextArea', () => ({
  FormTextArea: ({ name, disabled }: { name: string; disabled?: boolean }) => {
    const { register } = useFormContext();
    return <textarea aria-label="Your note" disabled={disabled} {...register(name)} />;
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
  useJobReferralDraft: () => mockUseDraft(),
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

/* The whole note, and the backend's own words for all of it. The modal used to
   splice `[Add a line about how you know Ada.]` in on top of the draft, so this
   constant and the `mockUseDraft` fixture below differed; they are now the same
   string, sourced from here, because "hands the draft through untouched" is the
   property under test and two literals could drift apart without failing. */
const DRAFTED_NOTE = 'Here is a draft.';

/** The tick, however it is currently labelled. Named before a member is picked. */
const copyTick = (name: RegExp = /Copy Ada on this email/i) => screen.getByRole('checkbox', { name });

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
    mockUseDraft.mockReturnValue({ data: { note: DRAFTED_NOTE }, isFetching: false, isError: false });
    mockSend.mockImplementation((_payload, opts) => {
      opts?.onSuccess?.({ uid: 'ref-1' });
    });
  });

  it('hides the member picker and skips the hiring-team fetch when a job-refer email is set', () => {
    renderModal('jobs@acme.com');

    expect(screen.queryByTestId('recipient-count')).not.toBeInTheDocument();
    expect(screen.getByText('Send to')).toBeInTheDocument();
    expect(
      screen.getByText(
        /This referral will be sent to the email this team set up for job referrals\. You can’t choose individual members\./,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('An email is sent to the address this team set up, including you.')).toBeInTheDocument();
    expect(mockUseTeamMembers).toHaveBeenCalledWith('Acme', false);
  });

  it('sends without recipients when a job-refer email is set', async () => {
    const user = userEvent.setup();
    renderModal('jobs@acme.com');

    await user.click(screen.getByRole('button', { name: 'Pick referee' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send referral' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Send referral' }));

    expect(mockSend).toHaveBeenCalledWith(
      {
        referredMemberUid: 'm1',
        note: DRAFTED_NOTE,
        recipients: [],
        /* The default, untouched by this test — the copy tick ships unchecked.
           Asserted here rather than loosened to `expect.any` so a change to that
           default fails on the payload too, not only in the tick's own tests. */
        includeReferredMember: false,
      },
      expect.any(Object),
    );
    expect(await screen.findByText('Referral sent')).toBeInTheDocument();
    expect(screen.getByText(/Your note is on its way to the team/)).toBeInTheDocument();
  });

  it('keeps member selection empty when the team has no job-refer email', () => {
    renderModal(null);

    expect(screen.getByText('Send to')).toBeInTheDocument();
    expect(screen.queryByText(/Search and select who from the Acme/)).not.toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByLabelText('Your note')).toHaveValue(DRAFTED_NOTE));
    expect(screen.getByRole('button', { name: 'Send referral' })).toBeDisabled();
  });

  /* The frontend adds no wording to the note. It used to add exactly one line — a
     bracketed how-you-know slot — and the ask now lives in the caption above the box
     instead, where it costs the referrer nothing to clear. The negative assertion is
     the one that matters: an equality check would still pass if the slot came back
     under a different name, and this is the shape it took. */
  it('hands the backend draft through verbatim, with no bracketed slot', async () => {
    const user = userEvent.setup();
    renderModal(null);

    await user.click(screen.getByRole('button', { name: 'Pick referee' }));

    const note = screen.getByLabelText('Your note');
    await waitFor(() => expect(note).toHaveValue(DRAFTED_NOTE));
    expect((note as HTMLTextAreaElement).value).not.toMatch(/\[Add a line/i);
    expect((note as HTMLTextAreaElement).value).not.toMatch(/how you know/i);
  });

  it('titles the modal for the role and says an email is sent to everyone added', () => {
    renderModal(null);

    expect(screen.getByRole('heading', { name: 'Refer someone for Protocol Engineer' })).toBeInTheDocument();
    expect(screen.getByText('An email is sent to everyone you add below, including you.')).toBeInTheDocument();
  });

  describe('copying the referred member', () => {
    it('offers the tick unchecked by default, and names the person once one is picked', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      // Before anyone is picked the ask is generic — there is no name to use yet.
      expect(copyTick(/Copy the person you.re referring on this email/i)).not.toBeChecked();

      await user.click(screen.getByRole('button', { name: 'Pick referee' }));

      /* Picking someone renames the tick but must not arm it: the choice is about
         the act of sending, not about who was chosen. */
      await waitFor(() => expect(copyTick()).not.toBeChecked());
    });

    it('sends includeReferredMember: false and omits the copied line from the receipt when left alone', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await user.click(screen.getByRole('button', { name: 'Pick referee' }));
      await waitFor(() => expect(copyTick()).not.toBeChecked());

      await user.click(screen.getByRole('button', { name: 'Send referral' }));

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ includeReferredMember: false }),
        expect.any(Object),
      );

      /* The receipt only ever *adds* the copied sentence. Until the backend honours
         `includeReferredMember` it copies them regardless, so saying "was not copied"
         here would be a lie the product can't back — silence is the honest state. */
      expect(
        await screen.findByText('Your note is on its way to the team. They can reply to you directly.'),
      ).toBeInTheDocument();
      expect(screen.queryByText(/was copied in too/)).not.toBeInTheDocument();
    });

    it('sends includeReferredMember: true and adds the copied line when the tick is set', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await user.click(screen.getByRole('button', { name: 'Pick referee' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send referral' })).toBeEnabled());
      await user.click(copyTick());
      await waitFor(() => expect(copyTick()).toBeChecked());
      await user.click(screen.getByRole('button', { name: 'Send referral' }));

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ includeReferredMember: true }),
        expect.any(Object),
      );

      expect(
        await screen.findByText(
          'Your note is on its way to the team. They can reply to you directly. Ada was copied in too.',
        ),
      ).toBeInTheDocument();
    });

    /* No separate notification is ever claimed, ticked or not — the referred member is
       CC'd on this one email and nothing else is sent. */
    it('never claims a separate notification', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await user.click(screen.getByRole('button', { name: 'Pick referee' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send referral' })).toBeEnabled());
      await user.click(screen.getByRole('button', { name: 'Send referral' }));

      await screen.findByText('Referral sent');
      expect(screen.queryByText(/is notified/)).not.toBeInTheDocument();
    });
  });

  it('says the draft failed and leaves the note writable', async () => {
    mockUseDraft.mockReturnValue({ data: undefined, isFetching: false, isError: true });
    const user = userEvent.setup();
    renderModal('jobs@acme.com');

    await user.click(screen.getByRole('button', { name: 'Pick referee' }));

    expect(
      await screen.findByText('We couldn’t draft a note for that member — write your own, or pick someone else.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Your note')).toBeEnabled();
  });
});
