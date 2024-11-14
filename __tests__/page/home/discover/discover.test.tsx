import Discover from '@/components/page/home/discover/discover';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { formatDiscoverData } from '@/utils/home.utils';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { useHomeAnalytics } from '@/analytics/home.analytics';

// Mocking dependencies
jest.mock('embla-carousel-react', () => ({
  __esModule: true,
  default: jest.fn(() => [jest.fn(), jest.fn()]),
}));

jest.mock('@/hooks/use-prev-next-buttons', () => ({
  usePrevNextButtons: () => ({
    onPrevButtonClick: jest.fn(),
    onNextButtonClick: jest.fn(),
    prevBtnDisabled: false,
    nextBtnDisabled: false,
  }),
}));

jest.mock('@/analytics/home.analytics');
jest.mock('@/utils/home.utils');
jest.mock('@/utils/common.utils');

describe('Discover Component', () => {
  const mockDiscoverData = [
    {
      uid: 'discover-1',
      question: 'Question 1',
      subText: 'sub text mock',
      viewCount: 120,
      shareCount: 45,
      answerSourceLinks: ['Source 1', 'Source 2'],
    },
    {
      uid: 'discover-2',
      question: 'Question 2',
      subText: 'sub text mock',
      viewCount: 120,
      shareCount: 45,
      answerSourceLinks: ['Source 1', 'Source 2'],
    },
    {
      uid: 'discover-3',
      question: 'Question 3',
      subText: 'sub text mock',
      viewCount: 120,
      shareCount: 45,
      answerSourceLinks: ['Source 1', 'Source 2'],
    },
    {
      uid: 'discover-4',
      question: 'Question 4',
      subText: 'sub text mock',
      viewCount: 120,
      shareCount: 45,
      answerSourceLinks: ['Source 1', 'Source 2'],
    }
  ];

  const formattedData = [
    {
      uid: 'discover-1',
      question: 'Question 1',
      subText: 'sub text mock',
      viewCount: 120,
      shareCount: 45,
      answerSourceLinks: ['Source 1', 'Source 2'],
    },
    {
      uid: 'discover-2',
      question: 'Question 2',
      subText: 'sub text mock',
      viewCount: 120,
      shareCount: 45,
      answerSourceLinks: ['Source 1', 'Source 2'],
    },
    {
      uid: 'discover-3',
      question: 'Question 3',
      subText: 'sub text mock',
      viewCount: 120,
      shareCount: 45,
      answerSourceLinks: ['Source 1', 'Source 2'],
    },
    {
      uid: 'discover-4',
      question: 'Question 4',
      subText: 'sub text mock',
      viewCount: 120,
      shareCount: 45,
      answerSourceLinks: ['Source 1', 'Source 2'],
    },
    { uid: 'discover-husky', type: 'discoverhusky' },
  ];

  const mockUserInfo = { id: 'user1' };
  const mockAnalytics = {
    onDiscoverHuskyClicked: jest.fn(),
    onDiscoverCarouselActionsClicked: jest.fn(),
  };

  beforeEach(() => {
    (formatDiscoverData as jest.Mock).mockReturnValue(formattedData);
    (useHomeAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    (getAnalyticsUserInfo as jest.Mock).mockReturnValue(mockUserInfo);
  });

  it('renders the Discover component', () => {
    render(<Discover discoverData={mockDiscoverData} userInfo={mockUserInfo} />);
    expect(screen.getByText('Discover')).toBeInTheDocument();
  });

  it('renders the correct number of cards', () => {
    render(<Discover discoverData={mockDiscoverData} userInfo={mockUserInfo} />);
    expect(screen.getAllByTestId('discover-card').length).toBe(4);
    expect(screen.getAllByTestId('discover-husky-card').length).toBe(1);
  });

  it('calls onDiscoverHuskyClicked when Husky button is clicked', () => {
    render(<Discover discoverData={mockDiscoverData} userInfo={mockUserInfo} />);
    fireEvent.click(screen.getByText('Husky'));
    expect(mockAnalytics.onDiscoverHuskyClicked).toHaveBeenCalled();
  });

  it('calls onDiscoverCarouselActionsClicked when carousel buttons are clicked', () => {
    render(<Discover discoverData={mockDiscoverData} userInfo={mockUserInfo} />);
    fireEvent.click(screen.getByAltText('left arrow'));
    fireEvent.click(screen.getByAltText('right arrow'));
    expect(mockAnalytics.onDiscoverCarouselActionsClicked).toHaveBeenCalledTimes(2);
  });

  it('disables the previous button when prevBtnDisabled is true', () => {
    jest.spyOn(require('@/hooks/use-prev-next-buttons'), 'usePrevNextButtons').mockReturnValue({
      onPrevButtonClick: jest.fn(),
      onNextButtonClick: jest.fn(),
      prevBtnDisabled: true,
      nextBtnDisabled: false,
    });

    render(<Discover discoverData={mockDiscoverData} userInfo={mockUserInfo} />);
    const leftButton = screen.getByTestId('prev-button');
    expect(leftButton).toHaveClass('disabled');
  });

  it('disables the next button when nextBtnDisabled is true', () => {
    jest.spyOn(require('@/hooks/use-prev-next-buttons'), 'usePrevNextButtons').mockReturnValue({
      onPrevButtonClick: jest.fn(),
      onNextButtonClick: jest.fn(),
      prevBtnDisabled: false,
      nextBtnDisabled: true,
    });

    render(<Discover discoverData={mockDiscoverData} userInfo={mockUserInfo} />);
    const rightButton = screen.getByTestId('next-button');
    expect(rightButton).toHaveClass('disabled');
  });
  
});
