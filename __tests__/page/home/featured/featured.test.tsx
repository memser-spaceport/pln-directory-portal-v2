import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useHomeAnalytics } from '@/analytics/home.analytics';
import { getAnalyticsUserInfo, getAnalyticsMemberInfo, getAnalyticsProjectInfo, getAnalyticsTeamInfo } from '@/utils/common.utils';
import Featured from '@/components/page/home/featured/featured';

// Mocking dependencies
jest.mock('@/analytics/home.analytics');
jest.mock('@/utils/common.utils');

describe('Featured Component', () => {
  const mockUserInfo = { id: 'user1' };
  const mockAnalytics = {
    onIrlCardClicked: jest.fn(),
    onMemberCardClicked: jest.fn(),
    onTeamCardClicked: jest.fn(),
    onProjectCardClicked: jest.fn(),
  };

  beforeEach(() => {
    (useHomeAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    (getAnalyticsUserInfo as jest.Mock).mockReturnValue(mockUserInfo);
  });

  const featuredData = [
    {
      id: '1',
      slugUrl: 'sample-event',
      name: 'Aleph Ciudad',
      description: 'This is a sample event description.',
      location: 'Sample Location',
      type: 'INVITE_ONLY',
      attendees: 10,
      startDate: '2024-12-02T07:00:00.000Z',
      endDate: '2024-12-10T07:00:00.000Z',
      bannerUrl: '/path/to/banner.jpg',
      category: 'event',
    },
    {
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
      category: 'member',
    },
    { category: 'team', id: '3', name: 'Team 1', isNew: true, logo: 'team url', shortDescription: 'lorem ipsum lorem ipsum' },
    { category: 'project', id: '4', name: 'Project 1' },
  ];

  it('renders the Featured component', () => {
    render(<Featured featuredData={featuredData} isLoggedIn={true} userInfo={mockUserInfo} />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('calls onIrlCardClicked when an event card is clicked', () => {
    render(<Featured featuredData={featuredData} isLoggedIn={true} userInfo={mockUserInfo} />);
    const eventLink = screen.getByTestId('featured-irl-card');
    fireEvent.click(eventLink);
    expect(mockAnalytics.onIrlCardClicked).toHaveBeenCalledWith(mockUserInfo, {
      uid: '1',
      name: 'Aleph Ciudad',
      slugUrl: 'sample-event',
      isInviteOnly: 'INVITE_ONLY',
    });
  });

  it('calls onMemberCardClicked when a people card is clicked', () => {
    render(<Featured featuredData={featuredData} isLoggedIn={true} userInfo={mockUserInfo} />);
    const memberLink = screen.getByText('John Doe');
    fireEvent.click(memberLink);
    expect(mockAnalytics.onMemberCardClicked).toHaveBeenCalledWith(mockUserInfo, getAnalyticsMemberInfo(featuredData[1]));
  });

  it('calls onTeamCardClicked when a team card is clicked', () => {
    render(<Featured featuredData={featuredData} isLoggedIn={true} userInfo={mockUserInfo} />);
    const teamLink = screen.getByText('Team 1');
    fireEvent.click(teamLink);
    expect(mockAnalytics.onTeamCardClicked).toHaveBeenCalledWith(mockUserInfo, getAnalyticsTeamInfo(featuredData[2]));
  });

  it('calls onProjectCardClicked when a project card is clicked', () => {
    render(<Featured featuredData={featuredData} isLoggedIn={true} userInfo={mockUserInfo} />);
    const projectLink = screen.getByText('Project 1');
    fireEvent.click(projectLink);
    expect(mockAnalytics.onProjectCardClicked).toHaveBeenCalledWith(mockUserInfo, getAnalyticsProjectInfo(featuredData[3]));
  });

  it('returns null for unsupported categories', () => {
    const unsupportedData = [{ category: 'unsupported', id: '5', name: 'Unsupported Item' }];

    render(<Featured featuredData={unsupportedData} isLoggedIn={true} userInfo={mockUserInfo} />);

    // Ensure that the unsupported item is not rendered
    expect(screen.queryByText('Unsupported Item')).not.toBeInTheDocument();
  });
});
