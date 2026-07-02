import { render, screen, fireEvent } from '@testing-library/react';
import { TeamsScopeTabs } from '@/components/page/teams/TeamsScopeTabs';
import { ITeamsSearchParams } from '@/types/teams.types';
import '@testing-library/jest-dom';

const mockSetParam = jest.fn();

jest.mock('@/services/teams', () => ({
  useTeamFilterStore: (selector: (store: { setParam: typeof mockSetParam }) => unknown) =>
    selector({ setParam: mockSetParam }),
}));

const baseSearchParams = {
  searchBy: '',
  sort: '',
  tags: '',
  membershipSources: '',
  fundingStage: '',
  technology: '',
  includeFriends: '',
  officeHoursOnly: '',
  focusAreas: '',
  isRecent: '',
  isHost: '',
  isSponsor: '',
} as unknown as ITeamsSearchParams;

describe('TeamsScopeTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to the All tab when followingOnly is not set', () => {
    render(<TeamsScopeTabs searchParams={baseSearchParams} followingTotal={3} />);
    expect(screen.getByText('All').closest('div')).toHaveClass(/active/i);
  });

  it('shows the Following tab as active with a count when followingOnly=true', () => {
    render(<TeamsScopeTabs searchParams={{ ...baseSearchParams, followingOnly: 'true' }} followingTotal={5} />);
    expect(screen.getByText(/Following \(5\)/)).toBeInTheDocument();
  });

  it('hides the count when followingTotal is 0', () => {
    render(<TeamsScopeTabs searchParams={baseSearchParams} followingTotal={0} />);
    expect(screen.queryByText(/Following \(0\)/)).not.toBeInTheDocument();
    expect(screen.getByText('Following')).toBeInTheDocument();
  });

  it('switches to the Following tab on click', () => {
    render(<TeamsScopeTabs searchParams={baseSearchParams} followingTotal={2} />);
    fireEvent.click(screen.getByText(/Following/));
    expect(mockSetParam).toHaveBeenCalledWith('followingOnly', 'true');
  });

  it('switches back to the All tab on click', () => {
    render(<TeamsScopeTabs searchParams={{ ...baseSearchParams, followingOnly: 'true' }} followingTotal={2} />);
    fireEvent.click(screen.getByText('All'));
    expect(mockSetParam).toHaveBeenCalledWith('followingOnly', '');
  });

  it('does not call setParam when clicking the already-active tab', () => {
    render(<TeamsScopeTabs searchParams={baseSearchParams} followingTotal={2} />);
    fireEvent.click(screen.getByText('All'));
    expect(mockSetParam).not.toHaveBeenCalled();
  });
});
