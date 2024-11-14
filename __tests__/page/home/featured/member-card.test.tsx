import { fireEvent, render, screen } from '@testing-library/react';
import MemberCard from '@/components/page/home/featured/member-card';
import '@testing-library/jest-dom';
import { EVENTS } from '@/utils/constants';

describe('MemberCard', () => {
  const memberMock = {
    name: 'John Doe',
    profile: '',
    mainTeam: { id: 1, name: 'Team A', role: 'Developer' },
    teams: [
      { id: 1, name: 'Team A' },
      { id: 2, name: 'Team B' },
      { id: 3, name: 'Team C' },
    ],
    bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer eu quam ex. Aliquam molestie mi lectus, ut tristique metus auctor placerat. Proin vulputate, leo pulvinar viverra congue, quam purus mollis massa',
    isNew: true,
    teamLead: false,
    openToWork: true,
  };

  it('renders without crashing', () => {
    render(<MemberCard member={memberMock} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

 /*  it('displays default profile image when no profile URL is provided', () => {
    render(<MemberCard member={memberMock} />);

    const img = screen.getByAltText('member image');
    expect(img).toHaveAttribute('src', '/icons/default_profile.svg');
  });
 */
/*   it('renders team lead badge when isTeamLead is true', () => {
    const teamLeadMock = { ...memberMock, teamLead: true };
    render(<MemberCard member={teamLeadMock} />);
    expect(screen.getAllByAltText('team lead').length).toBe(2);
  }); */

  it('renders open to work badge when openToWork is true', () => {
    render(<MemberCard member={memberMock} />);
    expect(screen.getAllByAltText('open to collaborate').length).toBe(2);
  });

  it('displays truncated bio with see more button', () => {
    render(<MemberCard member={memberMock} />);
    expect(screen.getByText('see more')).toBeInTheDocument();
  });

  it('calls onSeeMoreClickHandler when see more is clicked', () => {
    render(<MemberCard member={memberMock} />);

    const seeMoreButton = screen.getByText('see more');
    const spy = jest.spyOn(document, 'dispatchEvent');

    fireEvent.click(seeMoreButton);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EVENTS.OPEN_MEMBER_BIO_POPUP,
      })
    );
    spy.mockRestore(); // Clean up spy
  });

  it('displays "New" badge when isNew is true', () => {
    render(<MemberCard member={memberMock} />);
    expect(screen.getByTestId('new badge')).toBeInTheDocument();
  });

  it('displays the member role correctly', () => {
    render(<MemberCard member={memberMock} />);
    expect(screen.getAllByText('Developer').length).toBe(2);
  });

  it('displays contributor when no role is given ', () => {
    const updatedMock = { ...memberMock, mainTeam: { id: 1, name: 'Team A', role: '' } };
    render(<MemberCard member={updatedMock} />);
    expect(screen.getAllByText('Contributor').length).toBe(2);
  });
/* 
  it('has no gradient border when member is not team lead and open to work', () => {
    render(<MemberCard member={{ ...memberMock, teamLead: false, openToWork: false }} />);
    expect(screen.getByTestId('profile-outline')).not.toHaveClass('gradiant-border-rounded');
  }); */

  it('displays a hyphen when the main team name is not available', () => {
    const member = {
      name: 'John Doe',
      teams: [],
      mainTeam: null,
    };
    render(<MemberCard member={member} />);
    const teamNameElement = screen.getByText('-');
    expect(teamNameElement).toBeInTheDocument();
  });

  it('should not display the additional team count button when teams length is 2 or less', () => {
    const memberMock = {
      name: 'Jane Doe',
      teams: [
        { id: 1, name: 'Team A' },
        { id: 2, name: 'Team B' },
      ],
      mainTeam: { id: 1, name: 'Team A' },
    };

    render(<MemberCard member={memberMock} />);

    // Check that the additional teams button is not present
    const additionalTeamsButton = screen.queryByText('+1');
    expect(additionalTeamsButton).not.toBeInTheDocument();
  });

  it('should display the additional team count button and able to click', () => {
    const memberMock = {
      name: 'John Doe',
      teams: [
        { id: 1, name: 'Team A' },
        { id: 2, name: 'Team B' },
        { id: 3, name: 'Team C' },
        { id: 4, name: 'Team D' },
      ],
      mainTeam: { id: 1, name: 'Team A' },
    };

    render(<MemberCard member={memberMock} />);

    // Check if the additional teams button is displayed
    const additionalTeamsButtons = screen.getAllByText('+3');
    expect(additionalTeamsButtons.length).toBeGreaterThan(0);

    // Simulate click on each button to show tooltip
    additionalTeamsButtons.forEach((button) => {
      fireEvent.click(button);
    });
  });
});
