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

  it('lists every location, the first one marked as the HQ', () => {
    renderForm();

    expect(locationInputs().map((input) => (input as HTMLInputElement).value)).toEqual(['Varna', 'Sofia']);
    expect(screen.getByRole('textbox', { name: 'HQ location' })).toHaveValue('Varna');
    expect(screen.getByText('HQ')).toBeInTheDocument();
  });

  it('offers one empty field to a team with no location yet', () => {
    renderForm([]);

    expect(locationInputs()).toHaveLength(1);
    expect(locationInputs()[0]).toHaveValue('');
  });

  it('adds, edits and removes locations, and saves them with the first one as the HQ', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Remove HQ location' }));
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

    fireEvent.click(screen.getByRole('button', { name: 'Remove HQ location' }));
    expect(locationInputs()).toHaveLength(1);
    expect(locationInputs()[0]).toHaveValue('');
    save();

    await waitFor(() => expect(submitTeam).toHaveBeenCalled());
    expect(submitTeam).toHaveBeenCalledWith(expect.objectContaining({ location: null, locations: [] }));
  });

  it('stops offering more fields at 10 locations', () => {
    renderForm(Array.from({ length: 9 }, (_, index) => `City ${index}`));

    fireEvent.click(screen.getByRole('button', { name: 'Add location' }));

    expect(locationInputs()).toHaveLength(10);
    expect(screen.queryByRole('button', { name: 'Add location' })).not.toBeInTheDocument();
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
  it('shows every location when there are up to three', () => {
    render(<TeamProfileMeta team={{ ...team, locations: ['Varna', 'Sofia', 'Berlin'] }} />);

    expect(screen.getByText('Varna · Sofia · Berlin')).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
  });

  it('shows the first three and the number of the rest', () => {
    render(<TeamProfileMeta team={{ ...team, locations: ['Varna', 'Sofia', 'Berlin', 'Lisbon', 'Austin'] }} />);

    expect(screen.getByText('Varna · Sofia · Berlin')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows no location item for a team without locations', () => {
    render(<TeamProfileMeta team={{ ...team, dateFounded: 2014, locations: [] }} />);

    expect(screen.getByText(/2014/)).toBeInTheDocument();
    expect(screen.queryByText('·')).not.toBeInTheDocument();
  });
});
