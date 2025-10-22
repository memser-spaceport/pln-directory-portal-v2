import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DiscoverCard from '@/components/page/home/discover/discover-card';

describe('DiscoverCard', () => {
  const mockData = {
    question: 'What is Labweek?',
    subText: 'LabWeek is Protocol Labs global conference on decentralized tech and innovation.',
    image: {
      mob: 'mobile-image-url',
      desktop: 'desktop-image-url',
    },
    viewCount: 120,
    shareCount: 45,
    answerSourceLinks: ['Source 1', 'Source 2'],
  };

  const mockUserInfo = { uid: '1', name: 'Aaron', email: 'test@yopmail.com' };

  test('renders without crashing', () => {
    render(<DiscoverCard data={mockData} userInfo={mockUserInfo} />);
    expect(screen.getByText(mockData.question)).toBeInTheDocument();
    expect(screen.getByText(mockData.subText)).toBeInTheDocument();
  });

  test('displays correct view and share counts', () => {
    render(<DiscoverCard data={mockData} userInfo={mockUserInfo} />);
    expect(screen.getByText(mockData.viewCount)).toBeInTheDocument();
    expect(screen.getByText(mockData.shareCount)).toBeInTheDocument();
    expect(screen.getByText(`${mockData.answerSourceLinks.length} sources`)).toBeInTheDocument();
  });

  test('calls function and dispatches event on click', () => {
    const handler = jest.fn();
    document.addEventListener('open-husky-discover', handler);

    const { container } = render(<DiscoverCard data={mockData} userInfo={mockUserInfo} />);
    const card = container.querySelector('.discover-card');
    if (card) {
      fireEvent.click(card);
    }

    // Verify that document.dispatchEvent was called with the expected event
    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event.detail.question).toEqual(mockData.question);

    document.removeEventListener('open-husky-discover', handler);
  });
});
