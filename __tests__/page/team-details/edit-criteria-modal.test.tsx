import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

function Harness({ initial = ALL_ON, outcome = 'ok' }: { initial?: RoleCriterion[]; outcome?: 'ok' | 'fail' }) {
  const [open, setOpen] = useState(false);
  const [criteria, setCriteria] = useState(initial);
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
        isSaving={false}
        onSave={(disabled) => {
          onSave(disabled);
          if (outcome === 'fail') return;
          setCriteria(criteria.map((c) => ({ ...c, enabled: !disabled.includes(c.text) })));
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

beforeEach(() => onSave.mockReset());

describe('EditCriteriaModal', () => {
  it('lists the role’s requirements, all switchable, and says when a change applies', async () => {
    render(<Harness />);
    await open();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Changes apply from next week’s suggestions/)).toBeInTheDocument();
    for (const name of ['A', 'B', 'C']) expect(box(name)).toHaveAttribute('aria-checked', 'true');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
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

    expect(onSave).toHaveBeenCalledWith(['B']);
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

    expect(onSave).toHaveBeenCalledWith(['B']);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(box('B')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});
