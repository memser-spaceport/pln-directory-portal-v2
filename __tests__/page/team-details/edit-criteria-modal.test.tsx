import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
  roleTitle = 'Senior Rust Engineer',
}: {
  initial?: RoleCriterion[];
  initialPrompt?: string | null;
  outcome?: 'ok' | 'fail';
  roleTitle?: string;
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
        roleTitle={roleTitle}
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
const promptBox = () =>
  screen.getByRole('textbox', { name: 'Help us suggest better members for Senior Rust Engineer.' });

beforeEach(() => onSave.mockReset());

describe('EditCriteriaModal', () => {
  it('lists the role’s requirements, all switchable, and says when a change applies', async () => {
    render(<Harness />);
    await open();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    /* LAB-2904: the title and subtitle say the AI matches on these. */
    expect(screen.getByRole('heading', { name: 'Edit AI criteria' })).toBeInTheDocument();
    expect(screen.getByText('What the AI matches members against for Senior Rust Engineer.')).toBeInTheDocument();
    expect(screen.getByText('Changes apply from next week’s suggestions.')).toBeInTheDocument();
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

    /* LAB-2869: the label and the helper text say that the AI reads the box. */
    it('labels the box with the role and says the AI reads it', async () => {
      render(<Harness roleTitle="Storage Engineer" />);
      await open();

      const field = screen.getByRole('textbox', { name: 'Help us suggest better members for Storage Engineer.' });
      expect(screen.getByText('Tell the AI who you’re looking for')).toBeInTheDocument();
      expect(field).toHaveAccessibleDescription('Tell the AI who you’re looking for 0 / 500');
    });

    it('falls back to “this role” when the role has no title', async () => {
      render(<Harness roleTitle="" />);
      await open();

      expect(
        screen.getByRole('textbox', { name: 'Help us suggest better members for this role.' }),
      ).toBeInTheDocument();
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

/**
 * LAB-2854: the requirements under Skills / Experience / Seniority / Location
 * / Other headers, each row a short label over the full statement — and the
 * flat list, statement alone, an older backend gets.
 */
describe('EditCriteriaModal with structured criteria', () => {
  const STRUCTURED: RoleCriterion[] = [
    { text: 'Working hours overlapping Europe', enabled: true, label: 'Europe hours', group: 'Location' },
    { text: 'Hands-on proficiency in Rust', enabled: true, label: 'Rust', group: 'Skills' },
    { text: 'Five years of infrastructure work', enabled: true, label: '5+ yrs infra', group: 'Experience' },
    { text: 'Background in peer-to-peer protocols', enabled: false, label: 'Protocols', group: 'Skills' },
    { text: 'Writes clearly', enabled: true, group: 'Other' },
  ];

  /* Each list's visible header, or null for the flat list. */
  const headers = () =>
    screen.getAllByRole('list').map((list) => {
      const id = list.getAttribute('aria-labelledby');
      return id ? document.getElementById(id)?.textContent : null;
    });

  it('groups the requirements under headers in the fixed order, hiding empty groups', async () => {
    render(<Harness initial={STRUCTURED} />);
    await open();

    expect(headers()).toEqual(['Skills', 'Experience', 'Location', 'Other']);
    expect(screen.queryByText('Seniority')).not.toBeInTheDocument();

    const skills = screen.getByRole('list', { name: 'Skills' });
    expect(within(skills).getAllByRole('checkbox')).toHaveLength(2);
    expect(within(skills).getByText('Rust')).toBeInTheDocument();
    expect(within(skills).getByText('Hands-on proficiency in Rust')).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Location' })).getByText('Europe hours')).toBeInTheDocument();
  });

  it('shows the statement alone when a requirement has no label', async () => {
    render(<Harness initial={STRUCTURED} />);
    await open();

    const other = screen.getByRole('list', { name: 'Other' });
    expect(within(other).getByRole('checkbox')).toHaveAccessibleName('Writes clearly');
  });

  it('still saves the switched-off statements, not the labels', async () => {
    render(<Harness initial={STRUCTURED} />);
    await open();
    await userEvent.click(screen.getByRole('checkbox', { name: /^Rust\b/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(['Hands-on proficiency in Rust', 'Background in peer-to-peer protocols'], null);
  });

  it('lists the requirements flat, with no headers, when none has a group', async () => {
    render(
      <Harness
        initial={[
          { text: 'Hands-on proficiency in Rust', enabled: true, label: 'Rust' },
          { text: 'Writes clearly', enabled: true },
        ]}
      />,
    );
    await open();

    expect(headers()).toEqual([null]);
    const lists = screen.getAllByRole('list');
    expect(lists[0]).toHaveAccessibleName('Requirements');
    for (const group of ['Skills', 'Experience', 'Seniority', 'Location', 'Other']) {
      expect(screen.queryByText(group)).not.toBeInTheDocument();
    }
    expect(within(lists[0]).getByText('Rust')).toBeInTheDocument();
    expect(within(lists[0]).getByText('Hands-on proficiency in Rust')).toBeInTheDocument();
  });

  it('puts an ungrouped requirement under Other when the rest are grouped', async () => {
    render(
      <Harness
        initial={[
          { text: 'Writes clearly', enabled: true },
          { text: 'Hands-on proficiency in Rust', enabled: true, label: 'Rust', group: 'Skills' },
        ]}
      />,
    );
    await open();

    expect(headers()).toEqual(['Skills', 'Other']);
    expect(within(screen.getByRole('list', { name: 'Other' })).getByText('Writes clearly')).toBeInTheDocument();
  });
});
