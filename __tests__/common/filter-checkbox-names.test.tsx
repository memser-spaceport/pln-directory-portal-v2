/**
 * LAB-3095: filter checkboxes had no accessible name (axe button-name on /jobs, 30 of them), so screen readers and
 * agents could not tell them apart. Each one is named by its visible label.
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { CheckboxListItemRepresentation as GenericRow } from '@/components/common/filters/GenericCheckboxList/components/CheckboxListItemRepresentation/CheckboxListItemRepresentation';
import { CheckboxListItemRepresentation as MembersRow } from '@/components/page/members/MembersFilter/FilterCheckboxListWithSearch/components/CheckboxListItemRepresentation/CheckboxListItemRepresentation';

describe('filter checkbox names', () => {
  it('names a generic filter checkbox by its visible label, even when the label is an element', () => {
    render(
      <>
        <GenericRow label="Remote" checked={false} onClick={() => {}} count={3} />
        <GenericRow label={<strong>Engineering</strong>} checked onClick={() => {}} />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'Remote' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Engineering' })).toBeChecked();
  });

  it('names a members filter checkbox by its label', () => {
    render(<MembersRow label="Neurotech" checked={false} onClick={() => {}} />);
    expect(screen.getByRole('checkbox', { name: 'Neurotech' })).toBeInTheDocument();
  });
});
