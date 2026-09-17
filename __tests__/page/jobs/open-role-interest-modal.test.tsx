import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

/**
 * The note a member sends a team that has no posting for them.
 *
 * The rule worth pinning is that **Send waits for words**. `FormTextArea`'s
 * `isRequired` only styles the label — it registers the field with no validation
 * rules — so `formState.isValid` is `true` on an empty message. A Send button
 * trusting it would happily post nothing, and the server would take it (the
 * message is optional there). The gate is the component's own, and these tests
 * are what stop someone "simplifying" it back to `isValid`.
 */

import {
  OpenRoleInterestModal,
  OPEN_ROLE_NOTE_LABEL,
  OPEN_ROLE_SEND_LABEL,
  openRoleModalLede,
  openRoleModalTitle,
} from '@/components/page/jobs/OpenRoleInterestModal/OpenRoleInterestModal';

const TEAM = 'Protocol Labs';

const open = (over: Partial<React.ComponentProps<typeof OpenRoleInterestModal>> = {}) =>
  render(<OpenRoleInterestModal teamName={TEAM} isOpen onClose={jest.fn()} onSend={jest.fn()} {...over} />);

const send = () => screen.getByRole('button', { name: OPEN_ROLE_SEND_LABEL });
const field = () => screen.getByRole('textbox', { name: OPEN_ROLE_NOTE_LABEL });

describe('the open-role interest dialog', () => {
  it('names the team it is writing to', () => {
    open();

    expect(screen.getByRole('heading', { name: openRoleModalTitle(TEAM) })).toBeInTheDocument();
    expect(screen.getByText(openRoleModalLede(TEAM))).toBeInTheDocument();
  });

  /* The regression this file exists for. */
  it('refuses to send an empty note', () => {
    open();

    expect(send()).toBeDisabled();
  });

  /* Whitespace is not words. Trimmed before the check AND before the send, so a
     note of spaces neither enables the button nor reaches the server. */
  it('refuses to send whitespace', async () => {
    open();

    await userEvent.type(field(), '   ');

    expect(send()).toBeDisabled();
  });

  it('sends the trimmed note', async () => {
    const onSend = jest.fn();
    open({ onSend });

    await userEvent.type(field(), '  Distributed systems, ideally storage.  ');
    await userEvent.click(send());

    expect(onSend).toHaveBeenCalledWith('Distributed systems, ideally storage.');
  });

  it('holds still while a send is in flight', async () => {
    const onSend = jest.fn();
    open({ onSend, isSending: true });

    await userEvent.type(field(), 'Anything');

    expect(send()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  /* The note is the whole submission and is saved nowhere else, so a refusal
     keeps the dialog up with the words still in it. */
  it('shows the refusal without clearing what was written', async () => {
    open({ error: 'Could not send your interest. Please try again.' });

    await userEvent.type(field(), 'Protocol research');

    expect(screen.getByText('Could not send your interest. Please try again.')).toBeInTheDocument();
    expect(field()).toHaveValue('Protocol research');
    expect(send()).toBeEnabled();
  });

  /* One-way: nothing in this dialog may offer to take the signal back, because
     the server has no verb for it. */
  it('offers no undo', () => {
    open();

    const text = document.body.textContent?.toLowerCase() ?? '';
    for (const forbidden of ['undo', 'withdraw', 'you can remove']) {
      expect(text).not.toContain(forbidden);
    }
  });
});
