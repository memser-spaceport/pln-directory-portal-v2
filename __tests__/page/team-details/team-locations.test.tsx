import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const submitTeam = jest.fn();
jest.mock('@/components/page/team-details/hooks/useOnSubmit', () => ({
  useOnSubmit: () => ({ onSubmit: submitTeam, isPending: false }),
}));

const onTeamDetailEditFormSaved = jest.fn();
jest.mock('@/analytics/teams.analytics', () => ({
  useTeamAnalytics: () => ({
    onTeamDetailEditInputChanged: jest.fn(),
    onTeamDetailEditFormSaved,
    onTeamDetailStatusChanged: jest.fn(),
  }),
}));

jest.mock('@/services/teams/hooks/useTeamsFormOptions', () => ({
  useTeamsFormOptions: () => ({ data: { fundingStage: [], industryTags: [] } }),
}));
jest.mock('@/components/page/member-details/ProfileDetails/components/ProfileImageInput', () => ({
  ProfileImageInput: () => null,
}));
jest.mock('@/components/page/member-details/BioDetails/components/BioInput', () => ({
  BioInput: () => null,
}));

import { EditTeamDetailsForm } from '@/components/page/team-details/TeamDetails/components/EditTeamDetailsForm';
import { TeamProfileMeta } from '@/components/page/team-details/TeamDetails/components/TeamProfileMeta/TeamProfileMeta';

const team = { id: 'team-1', name: 'Acme', industryTags: [], locations: ['Varna', 'Sofia'] } as any;

const renderForm = (locations: string[] = team.locations) =>
  render(<EditTeamDetailsForm team={{ ...team, locations }} onClose={jest.fn()} />);

const locationInputs = () => within(screen.getByRole('group', { name: 'Locations' })).getAllByRole('textbox');
const save = () => fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0]);

describe('Team edit form: locations', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists every location, the first one marked as primary', () => {
    renderForm();

    expect(locationInputs().map((input) => (input as HTMLInputElement).value)).toEqual(['Varna', 'Sofia']);
    expect(screen.getByRole('textbox', { name: 'Primary location' })).toHaveValue('Varna');
    expect(screen.getByText('Primary')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Make Varna your primary location' })).not.toBeInTheDocument();
  });

  it('makes another location primary by swapping it with the current one', async () => {
    renderForm(['Varna', 'Sofia', 'Berlin']);

    fireEvent.click(screen.getByRole('button', { name: 'Make Berlin your primary location' }));

    expect(locationInputs().map((input) => (input as HTMLInputElement).value)).toEqual(['Berlin', 'Sofia', 'Varna']);
    save();

    await waitFor(() => expect(submitTeam).toHaveBeenCalled());
    expect(submitTeam).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'Berlin', locations: ['Berlin', 'Sofia', 'Varna'] }),
    );
  });

  it('offers one empty field to a team with no location yet', () => {
    renderForm([]);

    expect(locationInputs()).toHaveLength(1);
    expect(locationInputs()[0]).toHaveValue('');
    expect(screen.queryByText('Primary')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Remove/ })).not.toBeInTheDocument();
  });

  it('adds, edits and removes locations, and saves them with the first one as primary', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Remove Varna' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add location' }));
    fireEvent.change(locationInputs()[1], { target: { value: '  Berlin ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add location' }));
    save();

    await waitFor(() => expect(submitTeam).toHaveBeenCalled());
    expect(submitTeam).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'Sofia', locations: ['Sofia', 'Berlin'] }),
    );
    expect(onTeamDetailEditFormSaved).toHaveBeenCalledWith(
      expect.objectContaining({ values: expect.objectContaining({ locations: ['Sofia', 'Berlin'] }) }),
    );
  });

  it('empties the last field instead of removing it, and saves no location', async () => {
    renderForm(['Varna']);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Varna' }));
    expect(locationInputs()).toHaveLength(1);
    expect(locationInputs()[0]).toHaveValue('');
    save();

    await waitFor(() => expect(submitTeam).toHaveBeenCalled());
    expect(submitTeam).toHaveBeenCalledWith(expect.objectContaining({ location: null, locations: [] }));
  });

  it('caps each location at 100 characters', () => {
    renderForm();

    locationInputs().forEach((input) => expect(input).toHaveAttribute('maxLength', '100'));
  });

  it('stops offering more fields at 10 locations', () => {
    renderForm(Array.from({ length: 9 }, (_, index) => `City ${index}`));

    fireEvent.click(screen.getByRole('button', { name: 'Add location' }));

    expect(locationInputs()).toHaveLength(10);
    expect(screen.queryByRole('button', { name: 'Add location' })).not.toBeInTheDocument();
  });

  it('does not save without a primary location while other locations are filled', async () => {
    renderForm();

    fireEvent.change(locationInputs()[0], { target: { value: '' } });
    expect(screen.getByRole('button', { name: 'Remove location 1' })).toBeInTheDocument();
    save();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Add a primary location, or make one of your other locations primary',
    );
    expect(submitTeam).not.toHaveBeenCalled();
  });

  it('does not save the same place twice', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Add location' }));
    fireEvent.change(locationInputs()[2], { target: { value: ' varna' } });
    save();

    expect(await screen.findByRole('alert')).toHaveTextContent('Each location can only be added once');
    expect(submitTeam).not.toHaveBeenCalled();
  });
});

describe('Team profile header: locations', () => {
  /* Each location and its separator is its own element, so the item's text is read as a whole. */
  const locationText = () => screen.getByText('Varna').parentElement?.textContent;

  it('shows every location when there are up to three', () => {
    render(<TeamProfileMeta team={{ ...team, locations: ['Varna', 'Sofia', 'Berlin'] }} />);

    expect(locationText()).toBe('Varna·Sofia·Berlin');
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
  });

  it('shows the first three and the number of the rest', () => {
    render(<TeamProfileMeta team={{ ...team, locations: ['Varna', 'Sofia', 'Berlin', 'Lisbon', 'Austin'] }} />);

    expect(locationText()).toBe('Varna·Sofia·Berlin+2');
    /* The "+N" joins the text line through the outermost wrapper, the one the tooltip draws. */
    expect(screen.getByText('+2').closest('.overflowTrigger')?.parentElement).toHaveClass('location');
  });

  it('shows no location item for a team without locations', () => {
    render(<TeamProfileMeta team={{ ...team, dateFounded: 2014, locations: [] }} />);

    expect(screen.getByText(/2014/)).toBeInTheDocument();
    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });
});
