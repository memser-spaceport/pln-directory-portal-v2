import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TeamMemberCard from '@/components/page/team-form-info/team-member-card';

describe('TeamMemberCard Component', () => {
  const baseMember = {
    id: '1',
    name: 'John Doe',
    profile: '/profile.jpg',
    isVerified: true,
    teams: {
      role: 'Developer',
      teamLead: false,
      status: '',
    },
  };
  const mockToggle = jest.fn();
  const mockRemove = jest.fn();

  it('renders member info correctly', () => {
    render(<TeamMemberCard member={baseMember} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    expect(screen.getByTestId('team-member-card')).toBeInTheDocument();
    expect(screen.getByTestId('profile-image')).toHaveAttribute('src', '/profile.jpg');
    expect(screen.getAllByTestId('member-name')[0]).toHaveTextContent('John Doe');
    expect(screen.getAllByTestId('member-role')[0]).toHaveTextContent('Developer');
  });

  it('shows team lead badge if member is team lead', () => {
    render(<TeamMemberCard member={{ ...baseMember, teams: { ...baseMember.teams, teamLead: true } }} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    const badges = screen.getAllByTestId('team-lead-badge');
    expect(badges[0]).toBeInTheDocument();
  });

  it('calls handleTeamLeadToggle when toggle is clicked', () => {
    render(<TeamMemberCard member={baseMember} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    try {
      fireEvent.click(screen.getByTestId('team-lead-toggle'));
    } catch (e) {
      // Print the DOM for debugging
      // eslint-disable-next-line no-console
      console.log(screen.debug());
      throw e;
    }
    expect(mockToggle).toHaveBeenCalledWith('1');
  });

  it('shows disabled toggle if member is not verified', () => {
    render(<TeamMemberCard member={{ ...baseMember, isVerified: false }} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    expect(screen.getAllByTestId('team-lead-toggle-disabled')[0]).toBeDisabled();
  });

  it('calls handleRemoveMember when remove button is clicked', () => {
    render(<TeamMemberCard member={baseMember} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    fireEvent.click(screen.getByTestId('remove-member-btn'));
    expect(mockRemove).toHaveBeenCalledWith('1');
  });

  it('shows confirm changes section and undo button when member is marked for removal', () => {
    render(<TeamMemberCard member={{ ...baseMember, teams: { ...baseMember.teams, status: 'Delete' } }} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    expect(screen.getByTestId('confirm-changes-section')).toBeInTheDocument();
    expect(screen.getByTestId('undo-remove-btn')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('undo-remove-btn'));
    expect(mockRemove).toHaveBeenCalledWith('1');
  });

  it('shows toggle with orange border if status is Update', () => {
    render(<TeamMemberCard member={{ ...baseMember, teams: { ...baseMember.teams, status: 'Update' } }} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    expect(screen.getByTestId('team-lead-toggle-container')).toHaveClass('toggle-changes');
  });

  it('shows new member background if status is Add', () => {
    render(<TeamMemberCard member={{ ...baseMember, teams: { ...baseMember.teams, status: 'Add' } }} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    expect(screen.getByTestId('team-member-card')).toHaveClass('new__member');
  });

  it('shows default profile image if member.profile is undefined', () => {
    render(<TeamMemberCard member={{ ...baseMember, profile: '' }} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    expect(screen.getByTestId('profile-image')).toHaveAttribute('src', '/icons/default_profile.svg');
  });

  it('adds toggle-changes class when isMemberTeamLeadChanges is Update', () => {
    render(<TeamMemberCard member={{ ...baseMember, isVerified: false, teams: { ...baseMember.teams, status: 'Update' } }} handleTeamLeadToggle={mockToggle} handleRemoveMember={mockRemove} />);
    const containers = screen.getAllByTestId('team-lead-toggle-container-disabled');
    expect(containers.length).toBeGreaterThan(0);
    containers.forEach(container => {
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('toggle-changes');
    });
  });
});
