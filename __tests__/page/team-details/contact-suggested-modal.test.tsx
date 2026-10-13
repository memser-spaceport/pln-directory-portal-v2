import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import {
  ContactSuggestedModal,
  contactTemplate,
} from '@/components/page/team-details/TeamApplicants/components/ContactSuggestedModal';

/**
 * LAB-2847: the Contact modal. The draft lives in the host, so this harness
 * holds it the way the view does — per person, across closes and failures.
 */

const onSend = jest.fn();

function Harness({ outcome = 'ok', initialDraft }: { outcome?: 'ok' | 'fail'; initialDraft?: string }) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState<string | undefined>(initialDraft);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Reopen
      </button>
      <ContactSuggestedModal
        isOpen={open}
        onClose={() => setOpen(false)}
        personName="Ana Lopez"
        roleTitle="Senior Rust Engineer"
        teamName="Filecoin Foundation"
        draft={draft}
        onDraftChange={setDraft}
        isSending={false}
        onSend={(message) => {
          onSend(message);
          if (outcome === 'ok') setOpen(false);
        }}
      />
    </>
  );
}

const field = () => screen.getByRole('textbox', { name: 'Message' });
const send = () => screen.getByRole('button', { name: 'Send' });
const TEMPLATE = contactTemplate({
  firstName: 'Ana',
  roleTitle: 'Senior Rust Engineer',
  teamName: 'Filecoin Foundation',
});

beforeEach(() => onSend.mockReset());

describe('ContactSuggestedModal', () => {
  it('opens on a prefilled message naming the person, the role and the team, with no subject', () => {
    render(<Harness />);

    expect(screen.getByRole('dialog', { name: 'Contact Ana' })).toBeInTheDocument();
    expect(field()).toHaveValue(TEMPLATE);
    expect(TEMPLATE).toMatch(/^Hi Ana, I lead hiring for Senior Rust Engineer at Filecoin Foundation\./);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    expect(screen.getByText(/gets this by email from the PL Network/)).toBeInTheDocument();
    expect(screen.getByText(`${TEMPLATE.length} / 2000`)).toBeInTheDocument();
    expect(send()).toBeEnabled();
  });

  it('sends the edited message', async () => {
    render(<Harness />);
    await userEvent.clear(field());
    await userEvent.type(field(), '  Hi Ana, want to chat?  ');
    await userEvent.click(send());

    expect(onSend).toHaveBeenCalledWith('Hi Ana, want to chat?');
  });

  it('disables Send for an empty message', async () => {
    render(<Harness />);
    await userEvent.clear(field());
    await userEvent.type(field(), '   ');

    expect(send()).toBeDisabled();
  });

  it('caps the field at 2000 characters and disables Send for a longer message', () => {
    render(<Harness initialDraft={'x'.repeat(2001)} />);

    expect(field()).toHaveAttribute('maxLength', '2000');
    expect(screen.getByText('2001 / 2000')).toBeInTheDocument();
    expect(send()).toBeDisabled();

    fireEvent.change(field(), { target: { value: 'x'.repeat(2000) } });
    expect(send()).toBeEnabled();
  });

  it('keeps the text when the send fails, and after a close and reopen', async () => {
    render(<Harness outcome="fail" />);
    await userEvent.clear(field());
    await userEvent.type(field(), 'My own words');
    await userEvent.click(send());

    expect(onSend).toHaveBeenCalledWith('My own words');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(field()).toHaveValue('My own words');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reopen' }));
    expect(field()).toHaveValue('My own words');
  });
});
