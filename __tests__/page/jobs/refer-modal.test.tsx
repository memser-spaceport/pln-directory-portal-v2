import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { useFormContext } from 'react-hook-form';

import type { IJobRole } from '@/types/jobs.types';
import type { DirectoryMember } from '@/prototypes/entries/job-board/components/ReferModal/types';

const mockSend = jest.fn();
const mockUseTeamMembers = jest.fn();
const mockUseDraft = jest.fn();
/** What the stub search reports as typed when the outside row is pressed. */
const mockTypedQuery = jest.fn(() => '');

jest.mock('@/analytics/jobs.analytics', () => ({
  useJobsAnalytics: () => ({
    onJobReferModalOpened: jest.fn(),
    onJobReferModalCancelled: jest.fn(),
    onJobReferRefereeSelected: jest.fn(),
    onJobReferRecipientsChanged: jest.fn(),
    onJobReferNoteEdited: jest.fn(),
    onJobReferNoteReset: jest.fn(),
    onJobReferCcReferredPersonToggled: jest.fn(),
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

// `disabled` and `placeholder` are carried through deliberately: the modal disables the
// box until a draft lands and says in the placeholder what it is waiting for, and a mock
// that swallowed either prop would let those assertions pass without the component ever
// agreeing.
jest.mock('@/components/form/FormTextArea/FormTextArea', () => ({
  FormTextArea: ({ name, disabled, placeholder }: { name: string; disabled?: boolean; placeholder?: string }) => {
    const { register } = useFormContext();
    /* The name is the mock's own invention. In production the visible label is a
       sibling `<span>` that nothing links to the textarea, so the real control has
       no accessible name at all — only `aria-describedby`. Kept in step with that
       visible label anyway, so grepping the copy leads somewhere true. */
    return (
      <textarea
        aria-label="Add context for the hiring team"
        disabled={disabled}
        placeholder={placeholder}
        {...register(name)}
      />
    );
  },
}));

jest.mock('@/prototypes/entries/job-board/components/ReferModal/hooks/useTeamMembers', () => ({
  useTeamMembers: (...args: unknown[]) => mockUseTeamMembers(...args),
}));

/* Stands in for the search field itself — its menu, its query and its row are the
   other file's subject (`refer-outside-row.test.tsx`). What the modal needs from it is
   two presses: one that answers with a member, and one that hands the field's job to
   the three inputs, carrying whatever was typed. */
jest.mock('@/prototypes/entries/job-board/components/ReferModal/components/MemberSearchSelect', () => ({
  MemberSearchSelect: ({ onReferOutside }: { onReferOutside?: (typed: string) => void }) => {
    const { setValue } = useFormContext();
    return (
      <>
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
        {onReferOutside && (
          <button type="button" onClick={() => onReferOutside(mockTypedQuery())}>
            Refer outside
          </button>
        )}
      </>
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
  useJobReferralDraft: (input: unknown) => mockUseDraft(input),
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
    await waitFor(() => expect(screen.getByLabelText('Add context for the hiring team')).toHaveValue(DRAFTED_NOTE));
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

    const note = screen.getByLabelText('Add context for the hiring team');
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
    expect(screen.getByLabelText('Add context for the hiring team')).toBeEnabled();
  });

  /* The other state of "Who are you referring?". The card below it is not supposed to
     notice which state answered, so most of these assert on the shared surfaces — the
     note, the tick, the payload — rather than on the three inputs themselves. */
  describe('referring someone outside the network', () => {
    const OUTSIDE = {
      name: 'Sarah Cohen',
      email: 'sarah@mail.com',
      linkedin: 'https://linkedin.com/in/sarahcohen',
    };

    /** Fills the three inputs. Split out because every test below needs a valid trio
     *  before the card it is actually about wakes up. */
    const fillOutside = async (user: ReturnType<typeof userEvent.setup>, over: Partial<typeof OUTSIDE> = {}) => {
      const person = { ...OUTSIDE, ...over };
      await user.type(screen.getByLabelText(/Full name/), person.name);
      await user.type(screen.getByLabelText(/Email address/), person.email);
      await user.type(screen.getByLabelText(/LinkedIn profile/), person.linkedin);
    };

    const goOutside = async (user: ReturnType<typeof userEvent.setup>) =>
      user.click(screen.getByRole('button', { name: 'Refer outside' }));

    /* `clearAllMocks` clears calls but keeps implementations, so a `mockReturnValue`
       set by one test would prefill the next one's Full name behind its back. */
    beforeEach(() => mockTypedQuery.mockReturnValue(''));

    it('swaps the search for three required inputs, and swaps back', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);

      expect(screen.queryByRole('button', { name: 'Pick referee' })).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email address/)).toBeInTheDocument();
      expect(screen.getByLabelText(/LinkedIn profile/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Search someone in the network instead' }));

      expect(screen.getByRole('button', { name: 'Pick referee' })).toBeInTheDocument();
      expect(screen.queryByLabelText(/Full name/)).not.toBeInTheDocument();
    });

    it('carries a name typed into the search into Full name, without overwriting one already there', async () => {
      mockTypedQuery.mockReturnValue('Sarah Cohen');
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);
      expect(screen.getByLabelText(/Full name/)).toHaveValue('Sarah Cohen');

      // Back to the search and out again: what is already typed wins over what the
      // search reports, or returning would undo an edit.
      await user.click(screen.getByRole('button', { name: 'Search someone in the network instead' }));
      mockTypedQuery.mockReturnValue('Someone Else');
      await goOutside(user);

      expect(screen.getByLabelText(/Full name/)).toHaveValue('Sarah Cohen');
    });

    it('keeps the note inert and Send dead until all three inputs are valid', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);
      expect(screen.getByLabelText('Add context for the hiring team')).toBeDisabled();
      expect(screen.getByPlaceholderText(/Fill in their details above/)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Full name/), OUTSIDE.name);
      await user.type(screen.getByLabelText(/Email address/), OUTSIDE.email);
      expect(screen.getByRole('button', { name: 'Send referral' })).toBeDisabled();

      await user.type(screen.getByLabelText(/LinkedIn profile/), OUTSIDE.linkedin);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send referral' })).toBeEnabled());
    });

    /* The one assertion this whole branch turns on. `ReferredExternalPersonSchema`
       requires `linkedinUrl`, and the design this was ported from wrote `linkedin` —
       which the backend rejects outright rather than stripping. Asserted as a whole
       object, because a partial match on name and email would pass with the wrong key. */
    it('sends referredPerson with linkedinUrl, and no referredMemberUid', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);
      await fillOutside(user);
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send referral' })).toBeEnabled());
      await user.click(screen.getByRole('button', { name: 'Send referral' }));

      expect(mockSend).toHaveBeenCalledWith(
        {
          referredPerson: { name: OUTSIDE.name, email: OUTSIDE.email, linkedinUrl: OUTSIDE.linkedin },
          note: DRAFTED_NOTE,
          recipients: [],
          includeReferredMember: false,
        },
        expect.any(Object),
      );
      expect(mockSend.mock.calls[0][0]).not.toHaveProperty('referredMemberUid');
    });

    it('asks for the draft by name rather than by uid', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);
      await fillOutside(user);

      await waitFor(() =>
        expect(mockUseDraft).toHaveBeenLastCalledWith(
          expect.objectContaining({ referredName: OUTSIDE.name, referredMemberUid: undefined }),
        ),
      );
    });

    /* The XOR guard. Both keys together are a 400, and the inputs deliberately keep
       what they held after a trip back to the search — so "they are empty by then" is
       not the reason this holds.

       Asserts the contract, not one mechanism: `refereeMode` gating `outsidePerson` and
       the send branching on `selectedMember` each prevent this alone, so the test only
       goes red if both are removed. That is the point — what must never happen is a
       payload carrying both keys, however the code arranges to avoid it. */
    it('sends only referredMemberUid when the referrer fills the inputs then goes back and picks a member', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);
      await fillOutside(user);
      await user.click(screen.getByRole('button', { name: 'Search someone in the network instead' }));
      await user.click(screen.getByRole('button', { name: 'Pick referee' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send referral' })).toBeEnabled());
      await user.click(screen.getByRole('button', { name: 'Send referral' }));

      expect(mockSend.mock.calls[0][0]).toHaveProperty('referredMemberUid', 'm1');
      expect(mockSend.mock.calls[0][0]).not.toHaveProperty('referredPerson');
    });

    /* The profile's own rule, so a slug and a URL both pass here as they do on a
       member's contact card.

       The three accepted shapes are also the three `normalizeExternalLinkedinUrl`
       handles server-side. Listed here so the two ends can't drift apart quietly: a
       shape the backend would take but this field rejects is a dead end the referrer
       has no way to diagnose. */
    it.each([
      ['a bare slug', 'sarahcohen', true],
      ['a domain without a scheme', 'linkedin.com/in/sarahcohen', true],
      ['a full URL', 'https://linkedin.com/in/sarahcohen', true],
      ['a non-LinkedIn URL', 'https://example.com/sarah', false],
    ])('accepts %s as a LinkedIn profile: %s', async (_label, value, valid) => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);
      await fillOutside(user, { linkedin: value });
      // Blur, because the form validates on blur — see `mode` on `useForm`.
      await user.tab();

      const send = screen.getByRole('button', { name: 'Send referral' });
      if (valid) {
        await waitFor(() => expect(send).toBeEnabled());
      } else {
        expect(send).toBeDisabled();
        expect(await screen.findByText(/Enter a valid LinkedIn URL/)).toBeInTheDocument();
      }
    });

    it('names the typed person on the copy tick and copies them when it is set', async () => {
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);
      await user.type(screen.getByLabelText(/Full name/), OUTSIDE.name);
      // The tick can address them before the other two inputs are done.
      expect(copyTick(/Copy Sarah on this email/i)).toBeInTheDocument();

      await user.type(screen.getByLabelText(/Email address/), OUTSIDE.email);
      await user.type(screen.getByLabelText(/LinkedIn profile/), OUTSIDE.linkedin);
      await user.click(copyTick(/Copy Sarah on this email/i));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Send referral' })).toBeEnabled());
      await user.click(screen.getByRole('button', { name: 'Send referral' }));

      expect(mockSend.mock.calls[0][0]).toHaveProperty('includeReferredMember', true);
      expect(await screen.findByText(/Sarah was copied in too\./)).toBeInTheDocument();
    });

    /* The failure every wiring bug above surfaces as, so it must not read as normal —
       and it has nobody to "pick instead", which is what the member wording offers. */
    it('says the draft failed in words that fit having no member to pick', async () => {
      mockUseDraft.mockReturnValue({ data: undefined, isFetching: false, isError: true });
      const user = userEvent.setup();
      renderModal('jobs@acme.com');

      await goOutside(user);
      await fillOutside(user);

      expect(await screen.findByText('We couldn’t draft a note for them — write your own.')).toBeInTheDocument();
      expect(screen.getByLabelText('Add context for the hiring team')).toBeEnabled();
    });
  });
});
