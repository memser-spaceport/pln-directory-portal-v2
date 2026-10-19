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

function Harness({
  outcome = 'ok',
  initialDraft,
  postingHref = '/jobs/openings/role-1',
  senderName = 'Maya Chen',
  senderRole = 'Head of Engineering',
}: {
  outcome?: 'ok' | 'fail';
  initialDraft?: string;
  postingHref?: string | null;
  senderName?: string | null;
  senderRole?: string | null;
}) {
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
        postingHref={postingHref}
        senderName={senderName}
        senderRole={senderRole}
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
  senderName: 'Maya Chen',
  senderRole: 'Head of Engineering',
});

beforeEach(() => onSend.mockReset());

describe('ContactSuggestedModal', () => {
  it('opens on a prefilled message naming the person, the role and the team, with no subject', () => {
    render(<Harness />);

    expect(screen.getByRole('dialog', { name: 'Contact Ana' })).toBeInTheDocument();
    expect(field()).toHaveValue(TEMPLATE);
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

  /* LAB-2853: the design review's template, subtitle link, helper and button. */
  describe('the LAB-2853 template and chrome', () => {
    it('writes the multi-paragraph template with both first names, the lead’s role and team, and the role', () => {
      expect(TEMPLATE).toBe(
        [
          'Hi Ana,',
          "I'm Maya, Head of Engineering at Filecoin Foundation. I'm hiring for our Senior Rust Engineer role. You didn't apply; your profile came up as a match for it on the Protocol Labs network.",
          "If the role sounds worth a look, would you be open to a 20-minute call in the next couple of weeks? The posting is linked below. If the timing or the role isn't right, a one-line no is completely fine.",
          'Thanks,\nMaya',
        ].join('\n\n'),
      );
      expect(TEMPLATE.length).toBeLessThanOrEqual(2000);
    });

    it('shortens the introduction rather than printing a blank when the lead’s role or name is unknown', () => {
      const noRole = contactTemplate({
        firstName: 'Ana',
        roleTitle: 'Senior Rust Engineer',
        teamName: 'Filecoin Foundation',
        senderName: 'Maya Chen',
        senderRole: null,
      });
      expect(noRole).toContain("I'm Maya from Filecoin Foundation. I'm hiring for our Senior Rust Engineer role.");

      const nobody = contactTemplate({
        firstName: 'Ana',
        roleTitle: 'Senior Rust Engineer',
        teamName: 'Filecoin Foundation',
      });
      expect(nobody).toContain("I lead hiring at Filecoin Foundation. I'm hiring for our Senior Rust Engineer role.");
      expect(nobody.endsWith('\n\nThanks')).toBe(true);
      for (const text of [noRole, nobody]) expect(text).not.toMatch(/undefined|null|, at|  /);
    });

    it('prefills the field with the lead’s own introduction', () => {
      render(<Harness />);

      expect((field() as HTMLTextAreaElement).value).toMatch(
        /^Hi Ana,\n\nI'm Maya, Head of Engineering at Filecoin Foundation\./,
      );
    });

    it('links the role in the subtitle to its public posting, in a new tab', () => {
      render(<Harness />);

      const link = screen.getByRole('link', { name: /Senior Rust Engineer/ });
      expect(link).toHaveAttribute('href', '/jobs/openings/role-1');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
      expect(link.closest('p')).toHaveTextContent(/^About Senior Rust Engineer at Filecoin Foundation$/);
    });

    it('names the role without a link when there is no posting', () => {
      render(<Harness postingHref={null} />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('About Senior Rust Engineer at Filecoin Foundation')).toBeInTheDocument();
    });

    it('asks the lead to say what caught their eye, as the field’s description', () => {
      render(<Harness />);

      expect(field()).toHaveAccessibleDescription(/Say what caught your eye in Ana’s profile/);
    });

    it('labels the button Send', () => {
      render(<Harness />);

      expect(send()).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Send email' })).not.toBeInTheDocument();
    });
  });
});
