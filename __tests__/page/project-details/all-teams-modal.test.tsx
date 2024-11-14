import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AllTeamsModal from '@/components/page/project-details/all-teams-modal';
import { EVENTS } from '@/utils/constants';

describe('AllTeamsModal', () => {
  const onCloseMock = jest.fn();
  const onMaintainerTeamClickedMock = jest.fn();
  const onContributingTeamClickedMock = jest.fn();

  const project = {
    contributingTeams: [
      { id: 1, name: 'Contributing Team 1', logo: '/path/to/logo1.png' },
      { id: 2, name: 'Contributing Team 2', logo: '/path/to/logo2.png' },
    ],
    maintainingTeam: { id: 3, name: 'Maintaining Team', logo: '/path/to/logo3.png' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal with teams list', () => {
    render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={project}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    expect(screen.getByText('Teams (3)')).toBeInTheDocument();
    expect(screen.getByText('Maintaining Team')).toBeInTheDocument();
    expect(screen.getByText('Contributing Team 1')).toBeInTheDocument();
    expect(screen.getByText('Contributing Team 2')).toBeInTheDocument();
  });

  it('should render the modal with only maintaining team', () => {
    const projectWithEmptyTeamList = {
      ...project,
      contributingTeams: null
    };
    render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={projectWithEmptyTeamList}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    expect(screen.getByText('Teams (1)')).toBeInTheDocument();
    expect(screen.getByText('Maintaining Team')).toBeInTheDocument();
  });

  it('should call onClose when modal is closed', () => {
    render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={project}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    const closeButton = screen.getByAltText('close');
    fireEvent.click(closeButton);

    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should filter teams list based on search term', () => {
    render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={project}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'Contributing Team 1' } });

    expect(screen.getByText('Contributing Team 1')).toBeInTheDocument();
    expect(screen.queryByText('Contributing Team 2')).not.toBeInTheDocument();
  });

  it('should call onMaintainerTeamClicked when maintaining team is clicked', () => {
    render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={project}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    const maintainingTeam = screen.getByText('Maintaining Team');
    fireEvent.click(maintainingTeam);

    expect(onMaintainerTeamClickedMock).toHaveBeenCalledWith(project.maintainingTeam);
  });

  it('should call onContributingTeamClicked when a contributing team is clicked', () => {
    render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={project}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    const contributingTeam = screen.getByText('Contributing Team 1');
    fireEvent.click(contributingTeam);

    expect(onContributingTeamClickedMock).toHaveBeenCalledWith(project.contributingTeams[0]);
  });

  it('should render default logo when team logo is empty', () => {
    const projectWithEmptyLogo = {
      ...project,
      maintainingTeam: { ...project.maintainingTeam, logo: '' },
      contributingTeams: [
        { ...project.contributingTeams[0], logo: '' },
        { ...project.contributingTeams[1], logo: '/path/to/logo2.png' },
      ],
    };

    const { container } = render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={projectWithEmptyLogo}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    const targetImage = container.querySelector('img[src="/icons/team-default-profile.svg"]');
    expect(targetImage).toBeInTheDocument();
  });

  it('should trigger custom event when modal is opened', async () => {
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
    render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={project}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    const showModalEvent = new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_TEAMS_OPAN_AND_CLOSE, { detail: true });
    await act(async () => {
      document.dispatchEvent(showModalEvent);
    });

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it('should trigger custom event when modal is closed', async () => {
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
    render(
      <AllTeamsModal
        onClose={onCloseMock}
        project={project}
        onMaintainerTeamClicked={onMaintainerTeamClickedMock}
        onContributingTeamClicked={onContributingTeamClickedMock}
      />
    );

    const closeModalEvent = new CustomEvent(EVENTS.PROJECT_DETAIL_ALL_TEAMS_OPAN_AND_CLOSE, { detail: false });
    await act(async () => {
      document.dispatchEvent(closeModalEvent);
    });

    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });
});