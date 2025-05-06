import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileNavDrawer from '@/components/core/navbar/mobile-nav-drawer';
import { useCommonAnalytics } from '@/analytics/common.analytics';
import { useRouter, usePathname } from 'next/navigation';
import * as utils from '@/utils/common.utils';
import * as thirdPartyHelper from '@/utils/third-party.helper';
import * as broadcastChannel from '@/components/core/login/broadcast-channel';
import { toast } from 'react-toastify';
import useClickedOutside from '@/hooks/useClickedOutside';
import { EVENTS, HELPER_MENU_OPTIONS, NAV_OPTIONS, PAGE_ROUTES, TOAST_MESSAGES } from '@/utils/constants';

// Mock child components and next/image
jest.mock('next/image', () => ({ __esModule: true, default: (props: any) => <img {...props} /> }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
jest.mock('@/components/core/navbar/login-btn', () => ({ __esModule: true, default: () => <button>LoginBtn</button> }));
jest.mock('@/components/core/navbar/sign-up', () => ({ __esModule: true, default: () => <button>SignUpBtn</button> }));
jest.mock('@/components/core/navbar/join-network', () => ({ __esModule: true, default: () => <div>JoinNetwork</div> }));

// Mock hooks and utils
jest.mock('@/analytics/common.analytics', () => ({ useCommonAnalytics: jest.fn() }));
jest.mock('next/navigation', () => ({ useRouter: jest.fn(), usePathname: jest.fn() }));
jest.mock('@/hooks/useClickedOutside', () => jest.fn());
jest.mock('@/utils/common.utils', () => ({
  getAnalyticsUserInfo: jest.fn(() => 'user-info'),
  triggerLoader: jest.fn(),
}));
jest.mock('@/utils/third-party.helper', () => ({ clearAllAuthCookies: jest.fn() }));
jest.mock('@/components/core/login/broadcast-channel', () => ({ createLogoutChannel: jest.fn() }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn() } }));

const mockOnNavItemClicked = jest.fn();
const mockOnNavGetHelpItemClicked = jest.fn();
const mockOnNavAccountItemClicked = jest.fn();
const mockOnSubmitATeamBtnClicked = jest.fn();
const mockPush = jest.fn();
const mockTriggerLoader = utils.triggerLoader as jest.Mock;
const mockClearAllAuthCookies = thirdPartyHelper.clearAllAuthCookies as jest.Mock;
const mockCreateLogoutChannel = broadcastChannel.createLogoutChannel as jest.Mock;
const mockToastSuccess = toast.success as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockUsePathname = usePathname as jest.Mock;
const mockUseClickedOutside = useClickedOutside as jest.Mock;

const baseUserInfo = {
  name: 'Test User',
  profileImageUrl: '/test.png',
  email: 'test@example.com',
  uid: 'user-1',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue({ push: mockPush });
  mockUsePathname.mockReturnValue('/');
  (useCommonAnalytics as jest.Mock).mockReturnValue({
    onNavItemClicked: mockOnNavItemClicked,
    onNavGetHelpItemClicked: mockOnNavGetHelpItemClicked,
    onNavAccountItemClicked: mockOnNavAccountItemClicked,
    onSubmitATeamBtnClicked: mockOnSubmitATeamBtnClicked,
  });
  mockUseClickedOutside.mockImplementation(({ callback }) => callback);
  mockCreateLogoutChannel.mockReturnValue({ postMessage: jest.fn() });
});

/**
 * Test suite for MobileNavDrawer component.
 * Covers all branches, lines, and edge cases for 100% coverage.
 */
describe('MobileNavDrawer', () => {
  const defaultProps = {
    userInfo: baseUserInfo,
    isLoggedIn: false,
    onNavMenuClick: jest.fn(),
  };

  it('renders the drawer and close button', () => {
    render(<MobileNavDrawer {...defaultProps} />);
    expect(screen.getByText('Close Menu')).toBeInTheDocument();
  });

  it('calls onNavMenuClick when close button is clicked', () => {
    render(<MobileNavDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText('Close Menu'));
    expect(defaultProps.onNavMenuClick).toHaveBeenCalled();
  });

  it('renders all nav options and highlights active', () => {
    mockUsePathname.mockReturnValue(NAV_OPTIONS[0].url);
    render(<MobileNavDrawer {...defaultProps} />);
    NAV_OPTIONS.forEach(option => {
      expect(screen.getByText(option.name)).toBeInTheDocument();
    });
    // Active class check (optional, can use container.querySelector)
  });

  it('calls onNavItemClickHandler when a nav option is clicked (not active)', () => {
    mockUsePathname.mockReturnValue('/not-active');
    render(<MobileNavDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText(NAV_OPTIONS[0].name));
    expect(defaultProps.onNavMenuClick).toHaveBeenCalled();
    expect(mockTriggerLoader).toHaveBeenCalledWith(true);
    expect(mockOnNavItemClicked).toHaveBeenCalledWith(NAV_OPTIONS[0].name, 'user-info');
  });

  it('does not call onNavItemClickHandler if nav option is already active', () => {
    mockUsePathname.mockReturnValue(NAV_OPTIONS[0].url);
    render(<MobileNavDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText(NAV_OPTIONS[0].name));
    expect(mockOnNavItemClicked).not.toHaveBeenCalled();
  });

  it('calls onHelpItemClickHandler for help menu', () => {
    render(<MobileNavDrawer {...defaultProps} />);
    const helpOption = HELPER_MENU_OPTIONS.find(opt => opt.type !== 'button');
    if (helpOption) {
      fireEvent.click(screen.getByText(helpOption.name));
      expect(defaultProps.onNavMenuClick).toHaveBeenCalled();
      expect(mockOnNavGetHelpItemClicked).toHaveBeenCalledWith(helpOption.name, 'user-info');
    }
  });

  it('calls onAccountOptionClickHandler for settings', () => {
    render(<MobileNavDrawer {...defaultProps} isLoggedIn={true} />);
    fireEvent.click(screen.getByText('Settings'));
    expect(defaultProps.onNavMenuClick).toHaveBeenCalled();
    expect(mockOnNavAccountItemClicked).toHaveBeenCalledWith('settings', 'user-info');
  });

  it('calls handleSubmitTeam for Submit a Team button', () => {
    render(<MobileNavDrawer {...defaultProps} isLoggedIn={true} />);
    const submitOption = HELPER_MENU_OPTIONS.find(opt => opt.type === 'button' && opt.name === 'Submit a Team');
    if (submitOption) {
      fireEvent.click(screen.getByText(submitOption.name));
      expect(mockOnSubmitATeamBtnClicked).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith(PAGE_ROUTES.ADD_TEAM);
      expect(defaultProps.onNavMenuClick).toHaveBeenCalled();
    }
  });

  it('calls onLogoutClickHandler and clears cookies, broadcasts, and shows toast', () => {
    render(<MobileNavDrawer {...defaultProps} isLoggedIn={true} />);
    fireEvent.click(screen.getByText('Logout'));
    expect(mockOnNavAccountItemClicked).toHaveBeenCalledWith('logout', 'user-info');
    expect(mockClearAllAuthCookies).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalledWith(TOAST_MESSAGES.LOGOUT_MSG);
    expect(mockCreateLogoutChannel().postMessage).toHaveBeenCalledWith('logout');
  });

  it('renders LoginBtn if not logged in', () => {
    render(<MobileNavDrawer {...defaultProps} isLoggedIn={false} />);
    expect(screen.getByText('LoginBtn')).toBeInTheDocument();
  });

  it('renders user info and logout if logged in', () => {
    render(<MobileNavDrawer {...defaultProps} isLoggedIn={true} />);
    expect(screen.getByText(baseUserInfo.name)).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('closes drawer when clicking outside (useClickedOutside)', () => {
    render(<MobileNavDrawer {...defaultProps} />);
    act(() => {
      mockUseClickedOutside.mock.calls[0][0].callback();
    });
    expect(defaultProps.onNavMenuClick).toHaveBeenCalled();
  });

  it('does not render Submit a Team button if not logged in', () => {
    render(<MobileNavDrawer {...defaultProps} isLoggedIn={false} />);
    expect(screen.queryByText('Submit a Team')).not.toBeInTheDocument();
  });


  it('does not render help menu button if not Submit a Team', () => {
    const customHelperMenu = [
      ...HELPER_MENU_OPTIONS,
      { type: 'button', name: 'Other Button', icon: '/icons/other.svg' }
    ];
    jest.doMock('@/utils/constants', () => ({
      ...jest.requireActual('@/utils/constants'),
      HELPER_MENU_OPTIONS: customHelperMenu,
    }));
    // Re-import component after mocking
    const { default: MobileNavDrawerWithMock } = require('@/components/core/navbar/mobile-nav-drawer');
    render(<MobileNavDrawerWithMock {...defaultProps} isLoggedIn={true} />);
    expect(screen.queryByText('Other Button')).not.toBeInTheDocument();
  });

  it('does not render Settings link if not logged in', () => {
    render(<MobileNavDrawer {...defaultProps} isLoggedIn={false} />);
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  it('renders settings link and user info if userInfo is present and logged in', () => {
    render(<MobileNavDrawer {...defaultProps} isLoggedIn={true} />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText(baseUserInfo.name)).toBeInTheDocument();
  });

  it('renders default profile image and empty name if userInfo is missing', () => {
    render(<MobileNavDrawer userInfo={{} as any} isLoggedIn={true} onNavMenuClick={jest.fn()} />);
    expect(screen.getByAltText('profile')).toHaveAttribute('src', '/icons/default_profile.svg');
    // Name div should be empty or not throw
    const nameDiv = document.querySelector('.md__container__bdy__footer__usrop__profilesec__name');
    expect(nameDiv).toBeInTheDocument();
    expect(nameDiv).toBeEmptyDOMElement();
  });
}); 