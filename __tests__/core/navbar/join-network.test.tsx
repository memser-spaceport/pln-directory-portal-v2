import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import JoinNetwork from '@/components/core/navbar/join-network';
import '@testing-library/jest-dom';
import { useCommonAnalytics } from '@/analytics/common.analytics';

jest.mock('js-cookie');
jest.mock('react-toastify');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/analytics/common.analytics');
jest.mock('@/hooks/useClickedOutside');

describe('JoinNetwork Component', () => {
  const mockRouter = { refresh: jest.fn() };
  const mockAnalytics = {
    onNavJoinNetworkClicked: jest.fn(),
    onNavJoinNetworkOptionClicked: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useCommonAnalytics as jest.Mock).mockReturnValue(mockAnalytics);
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<JoinNetwork />);
    expect(screen.getByText('Join the network')).toBeInTheDocument();
  });

  it('handles onJoinNetworkClick when user is logged in', () => {
    (Cookies.get as jest.Mock).mockReturnValue('userInfo');
    render(<JoinNetwork />);
    fireEvent.click(screen.getByText('Join the network'));
    expect(toast.info).toHaveBeenCalledWith('You are already logged in');
    expect(mockRouter.refresh).toHaveBeenCalled();
  });

  it('handles onJoinNetworkClick when user is not logged in', () => {
    (Cookies.get as jest.Mock).mockReturnValue(null);
    render(<JoinNetwork />);
    fireEvent.click(screen.getByText('Join the network'));
    expect(mockAnalytics.onNavJoinNetworkClicked).toHaveBeenCalled();
  });

  it('handles onJoinNetworkListClick for member', () => {
    render(<JoinNetwork />);
    fireEvent.click(screen.getByText('Join the network'));
    fireEvent.click(screen.getByText('As a Member'));
    expect(mockAnalytics.onNavJoinNetworkOptionClicked).toHaveBeenCalled();
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    const customEvent = new CustomEvent('open-member-register-dialog');
    fireEvent(document, customEvent);
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'open-member-register-dialog' }));
  });

  it('handles onJoinNetworkListClick for team', () => {
    render(<JoinNetwork />);
    fireEvent.click(screen.getByText('Join the network'));
    fireEvent.click(screen.getByText('As a Team'));
    expect(mockAnalytics.onNavJoinNetworkOptionClicked).toHaveBeenCalled();
    const dispatchEventSpy = jest.spyOn(document, 'dispatchEvent');
    const customEvent = new CustomEvent('open-team-register-dialog');
    fireEvent(document, customEvent);
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'open-team-register-dialog' }));
  });

  it('opens and closes the dropdown menu correctly', () => {
    render(<JoinNetwork />);
    const button = screen.getByText('Join the network');
    fireEvent.click(button);
    expect(screen.getByText('As a Member')).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText('As a Team')).not.toBeInTheDocument();
  });

});
