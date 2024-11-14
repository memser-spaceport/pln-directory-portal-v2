import Contributors from '@/components/page/project-details/contributors';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAnalyticsMemberInfo, getAnalyticsProjectInfo, getAnalyticsUserInfo } from '@/utils/common.utils';
import { useProjectAnalytics } from '@/analytics/project.analytics';
import { EVENTS } from '@/utils/constants';
jest.mock('@/analytics/project.analytics', () => ({
  useProjectAnalytics: jest.fn(),
}));
describe('Contributors', () => {
  const mockAnalytics = {
    onProjectDetailContributorClicked: jest.fn(),
    onProjDetailSeeAllContributorsClicked: jest.fn()
    // onDiscoverCarouselActionsClicked: jest.fn(),
  };
 
  const contributors = [
    { uid: '1', name: 'Contributor 1', logo: '/path/to/logo1.png' },
    { uid: '2', name: 'Contributor 2', logo: '/path/to/logo2.png' },
  ];
  const user = { id: 'user1', name: 'User 1' ,email:'user1@gmail.com',roles:['admin']};
  const project :any = { id: 'project1', name: 'Project 1' };

  it('should render the contributors title correctly', () => {
    render(<Contributors contributors={contributors} user={user} project={project} />);
    expect(screen.getByText('Contributors')).toBeInTheDocument();
  });

  it('should render the contributors count correctly', () => {
    render(<Contributors contributors={contributors} user={user} project={project} />);
    const contributorsCount = screen.getByText(contributors.length.toString());
    expect(contributorsCount).toBeInTheDocument();
  });

  it('should render the contributors list', () => {
    const { container } = render(<Contributors contributors={contributors} user={user} project={project} />);
    const contributorElement = screen.getByTitle('Contributor 1');
    expect(contributorElement).toBeInTheDocument();
    const targetImage = container.querySelector('img[src="/path/to/logo1.png"]');
    expect(targetImage).toBeInTheDocument();
  });

  it('should render the contributors with default image if none is given', () => {
    const contributorsWithoutLogo = [
      { uid: '1', name: 'Contributor 1', logo: '' },
      { uid: '2', name: 'Contributor 2', logo: '/path/to/logo2.png' },
    ];
    const { container } = render(<Contributors contributors={contributorsWithoutLogo} user={user} project={project} />);
    const contributorElement = screen.getByTitle('Contributor 1');
    expect(contributorElement).toBeInTheDocument();
    const targetImage = container.querySelector('img[src="/icons/default_profile.svg"]');
    expect(targetImage).toBeInTheDocument();
  });

  it('should call analytics and open a new window when a contributor is clicked', () => {
    const openMock = jest.fn();
    (useProjectAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    window.open = openMock;
    render(<Contributors contributors={contributors} user={user} project={project} />);
    const contributorElement = screen.getByTitle('Contributor 1');
    fireEvent.click(contributorElement);
  
    expect(mockAnalytics.onProjectDetailContributorClicked).toHaveBeenCalled();
    expect(openMock).toHaveBeenCalledWith('/members/1', '_blank');
  });

  // it('should call onCloseContributorsModal when the modal is closed', () => {
  //   const onCloseContributorsModalMock = jest.fn();
  //   render(
  //     <Contributors contributors={contributors} user={user} project={project} onClose={onCloseContributorsModalMock} />
  //   );
  //   const closeButton = screen.getByRole('button', { name: /contributors__hdr/i });
  //   fireEvent.click(closeButton);
  //   expect(onCloseContributorsModalMock).toHaveBeenCalled();
  // });

  it('should display the more contributors button when there are more than 20 data', () => {
    const contributorsList = [
      { uid: '1', name: 'Contributor 1', logo: '/path/to/logo1.png' },
      { uid: '2', name: 'Contributor 2', logo: '/path/to/logo2.png' },
      { uid: '3', name: 'Contributor 3', logo: '/path/to/logo3.png' },
      { uid: '4', name: 'Contributor 4', logo: '/path/to/logo4.png' },
      { uid: '5', name: 'Contributor 5', logo: '/path/to/logo5.png' },
      { uid: '6', name: 'Contributor 6', logo: '/path/to/logo6.png' },
      { uid: '7', name: 'Contributor 7', logo: '/path/to/logo7.png' },
      { uid: '8', name: 'Contributor 8', logo: '/path/to/logo8.png' },
      { uid: '9', name: 'Contributor 9', logo: '/path/to/logo9.png' },
      { uid: '10', name: 'Contributor 10', logo: '/path/to/logo10.png' },
      { uid: '11', name: 'Contributor 11', logo: '/path/to/logo11.png' },
      { uid: '12', name: 'Contributor 12', logo: '/path/to/logo12.png' },
      { uid: '13', name: 'Contributor 13', logo: '/path/to/logo13.png' },
      { uid: '14', name: 'Contributor 14', logo: '/path/to/logo14.png' },
      { uid: '15', name: 'Contributor 15', logo: '/path/to/logo15.png' },
      { uid: '16', name: 'Contributor 16', logo: '/path/to/logo16.png' },
      { uid: '17', name: 'Contributor 17', logo: '/path/to/logo17.png' },
      { uid: '18', name: 'Contributor 18', logo: '/path/to/logo18.png' },
      { uid: '19', name: 'Contributor 19', logo: '/path/to/logo19.png' },
      { uid: '20', name: 'Contributor 20', logo: '/path/to/logo20.png' },
      { uid: '21', name: 'Contributor 21', logo: '/path/to/logo21.png' },
      { uid: '22', name: 'Contributor 22', logo: '/path/to/logo22.png' },
      { uid: '23', name: 'Contributor 23', logo: '/path/to/logo23.png' },
      { uid: '24', name: 'Contributor 24', logo: '/path/to/logo24.png' },
      { uid: '25', name: 'Contributor 25', logo: '/path/to/logo25.png' },
    ];
    render(
      <Contributors contributors={contributorsList} user={user} project={project} />
    );
    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('should display the more contributors button when there are more than 20 data', () => {
    const contributorsList = [
      { uid: '1', name: 'Contributor 1', logo: '/path/to/logo1.png' },
      { uid: '2', name: 'Contributor 2', logo: '/path/to/logo2.png' },
      { uid: '3', name: 'Contributor 3', logo: '/path/to/logo3.png' },
      { uid: '4', name: 'Contributor 4', logo: '/path/to/logo4.png' },
      { uid: '5', name: 'Contributor 5', logo: '/path/to/logo5.png' },
      { uid: '6', name: 'Contributor 6', logo: '/path/to/logo6.png' },
      { uid: '7', name: 'Contributor 7', logo: '/path/to/logo7.png' },
      { uid: '8', name: 'Contributor 8', logo: '/path/to/logo8.png' },
      { uid: '9', name: 'Contributor 9', logo: '/path/to/logo9.png' },
      { uid: '10', name: 'Contributor 10', logo: '/path/to/logo10.png' },
      { uid: '11', name: 'Contributor 11', logo: '/path/to/logo11.png' },
      { uid: '12', name: 'Contributor 12', logo: '/path/to/logo12.png' },
      { uid: '13', name: 'Contributor 13', logo: '/path/to/logo13.png' },
      { uid: '14', name: 'Contributor 14', logo: '/path/to/logo14.png' },
      { uid: '15', name: 'Contributor 15', logo: '/path/to/logo15.png' },
      { uid: '16', name: 'Contributor 16', logo: '/path/to/logo16.png' },
      { uid: '17', name: 'Contributor 17', logo: '/path/to/logo17.png' },
      { uid: '18', name: 'Contributor 18', logo: '/path/to/logo18.png' },
      { uid: '19', name: 'Contributor 19', logo: '/path/to/logo19.png' },
      { uid: '20', name: 'Contributor 20', logo: '/path/to/logo20.png' },
      { uid: '21', name: 'Contributor 21', logo: '/path/to/logo21.png' },
      { uid: '22', name: 'Contributor 22', logo: '/path/to/logo22.png' },
      { uid: '23', name: 'Contributor 23', logo: '/path/to/logo23.png' },
      { uid: '24', name: 'Contributor 24', logo: '/path/to/logo24.png' },
      { uid: '25', name: 'Contributor 25', logo: '/path/to/logo25.png' },
    ];
    (useProjectAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    render(
      <Contributors contributors={contributorsList} user={user} project={project} />
    );
    const moreContributorsButton = screen.getByText('+5');
    fireEvent.click(moreContributorsButton);
    
    expect(mockAnalytics.onProjectDetailContributorClicked).toHaveBeenCalled();
  });

  it('should not thrown error when there are no contributors', () => {
    const contributorsListEmpty: any[] = [];
    render(
      <Contributors contributors={contributorsListEmpty} user={user} project={project} />
    );
    expect(screen.queryAllByTitle('Contributor 1').length).toBe(0);
  });


});