import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { EditCriteriaModal } from '@/components/page/team-details/TeamApplicants/components/EditCriteriaModal';
import type { RoleCriterion } from '@/schema/suggested-candidates';

/**
 * LAB-2847: the Edit criteria modal. The host owns the save; this harness
 * stands in for it the way the view does — it closes on success and keeps the
 * modal open on failure.
 */

const ALL_ON: RoleCriterion[] = [
  { text: 'A', enabled: true },
  { text: 'B', enabled: true },
  { text: 'C', enabled: true },
];

function Harness({
  initial = ALL_ON,
  initialPrompt = null,
  outcome = 'ok',
}: {
  initial?: RoleCriterion[];
  initialPrompt?: string | null;
  outcome?: 'ok' | 'fail';
}) {
  const [open, setOpen] = useState(false);
  const [criteria, setCriteria] = useState(initial);
  const [prompt, setPrompt] = useState(initialPrompt);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <EditCriteriaModal
        isOpen={open}
        onClose={() => setOpen(false)}
        roleTitle="Senior Rust Engineer"
        criteria={criteria}
        prompt={prompt}
        isSaving={false}
        onSave={(disabled, nextPrompt) => {
          onSave(disabled, nextPrompt);
          if (outcome === 'fail') return;
          setCriteria(criteria.map((c) => ({ ...c, enabled: !disabled.includes(c.text) })));
          setPrompt(nextPrompt);
          setOpen(false);
        }}
      />
    </>
  );
}

const onSave = jest.fn();
/* Anchored, because a locked row's name carries its hint after the text. */
const box = (name: string) => screen.getByRole('checkbox', { name: new RegExp(`^${name}\\b`) });
const open = () => userEvent.click(screen.getByRole('button', { name: 'Open' }));
const promptBox = () => screen.getByRole('textbox', { name: 'Tell us who you’re looking for' });

beforeEach(() => onSave.mockReset());

describe('EditCriteriaModal', () => {
  it('lists the role’s requirements, all switchable, and says when a change applies', async () => {
    render(<Harness />);
    await open();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Changes apply from next week’s suggestions/)).toBeInTheDocument();
    for (const name of ['A', 'B', 'C']) expect(box(name)).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps Save disabled until something changes', async () => {
    render(<Harness />);
    await open();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await userEvent.click(box('B'));
    expect(box('B')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    await userEvent.click(box('B'));
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves the switched-off texts and closes', async () => {
    render(<Harness />);
    await open();
    await userEvent.click(box('B'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(['B'], null);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await open();
    expect(box('A')).toHaveAttribute('aria-checked', 'true');
    expect(box('B')).toHaveAttribute('aria-checked', 'false');
    expect(box('C')).toHaveAttribute('aria-checked', 'true');
  });

  it('will not switch off the last requirement that is on', async () => {
    render(
      <Harness
        initial={[
          { text: 'A', enabled: true },
          { text: 'B', enabled: false },
        ]}
      />,
    );
    await open();

    expect(box('A')).toBeDisabled();
    expect(box('A')).toHaveAccessibleName(/At least one requirement stays on/);
    await userEvent.click(box('A'));
    expect(box('A')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('discards the draft on Cancel and sends nothing', async () => {
    render(<Harness />);
    await open();
    await userEvent.click(box('B'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSave).not.toHaveBeenCalled();
    await open();
    expect(box('B')).toHaveAttribute('aria-checked', 'true');
  });

  it('stays open on the draft when the save fails', async () => {
    render(<Harness outcome="fail" />);
    await open();
    await userEvent.click(box('B'));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(['B'], null);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(box('B')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  /* LAB-2853: the lead's own words, saved with the switches. */
  describe('the prompt', () => {
    it('offers one free-text box, empty when nothing is saved, capped at 500', async () => {
      render(<Harness />);
      await open();

      expect(screen.getAllByRole('textbox')).toHaveLength(1);
      expect(promptBox()).toHaveValue('');
      expect(promptBox()).toHaveAttribute('maxLength', '500');
      expect(screen.getByText('0 / 500')).toBeInTheDocument();
    });

    it('opens on the saved prompt', async () => {
      render(<Harness initialPrompt="Ran a storage network" />);
      await open();

      expect(promptBox()).toHaveValue('Ran a storage network');
    });

    it('enables Save for a prompt change alone and sends it trimmed, with the switches as they are', async () => {
      render(<Harness />);
      await open();
      await userEvent.type(promptBox(), '  Ran a storage network  ');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(onSave).toHaveBeenCalledWith([], 'Ran a storage network');
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await open();
      expect(promptBox()).toHaveValue('Ran a storage network');
    });

    it('keeps Save disabled for whitespace only', async () => {
      render(<Harness />);
      await open();
      await userEvent.type(promptBox(), '   ');

      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });

    it('sends null to clear a saved prompt', async () => {
      render(<Harness initialPrompt="Ran a storage network" />);
      await open();
      await userEvent.clear(promptBox());
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(onSave).toHaveBeenCalledWith([], null);
    });

    it('discards an edited prompt on Cancel', async () => {
      render(<Harness initialPrompt="Ran a storage network" />);
      await open();
      await userEvent.clear(promptBox());
      await userEvent.type(promptBox(), 'Something else');
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await open();
      expect(promptBox()).toHaveValue('Ran a storage network');
      expect(onSave).not.toHaveBeenCalled();
    });

    it('keeps the prompt draft when the save fails', async () => {
      render(<Harness outcome="fail" />);
      await open();
      await userEvent.type(promptBox(), 'Ran a storage network');
      await userEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(onSave).toHaveBeenCalledWith([], 'Ran a storage network');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(promptBox()).toHaveValue('Ran a storage network');
    });

    it('disables Save for a saved draft longer than the limit', async () => {
      render(<Harness />);
      await open();
      fireEvent.change(promptBox(), { target: { value: 'x'.repeat(501) } });

      expect(screen.getByText('501 / 500')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });
  });
});
