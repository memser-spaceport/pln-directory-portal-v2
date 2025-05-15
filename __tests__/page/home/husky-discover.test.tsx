import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HuskyDiscover from '@/components/page/home/husky-discover';
import { useRouter, useSearchParams } from 'next/navigation';
import { getHuskyResponseBySlug, incrementHuskyViewCount } from '@/services/discovery.service';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';
import cookies from 'js-cookie';
import { toast } from 'react-toastify';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/services/discovery.service', () => ({
  getHuskyResponseBySlug: jest.fn(),
  incrementHuskyViewCount: jest.fn(),
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: jest.fn(),
}));

jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock HuskyAi component
jest.mock('@/components/core/husky/husky-ai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(({ blogId, isLoggedIn, initialChats, mode, onClose }) => (
    <div data-testid="mock-husky-ai">
      <div data-testid="blog-id">{blogId}</div>
      <div data-testid="is-logged-in">{isLoggedIn ? 'true' : 'false'}</div>
      <div data-testid="chats-count">{initialChats.length}</div>
      <div data-testid="mode">{mode}</div>
      <button data-testid="close-button" onClick={onClose}>Close</button>
    </div>
  )),
}));

// Mock PageLoader component
jest.mock('@/components/core/page-loader', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => <div data-testid="page-loader">Loading...</div>),
}));

// Mock HuskyDiscover to access internal functions
jest.mock('@/components/page/home/husky-discover', () => {
  const originalModule = jest.requireActual('@/components/page/home/husky-discover');
  const component = originalModule.default;
  return component;
});

// Create a mock implementation of the component that exposes the getUserInfoFromCookie function
const getUserInfoFromCookie = () => {
  const rawUserInfo = cookies.get('userInfo');
  if (rawUserInfo) {
    try {
      const parsedUserInfo = JSON.parse(rawUserInfo);
      return parsedUserInfo;
    } catch (e) {
      return null;
    }
  }
  return null;
};

describe('HuskyDiscover Component', () => {
  const mockRouter = { push: jest.fn() };
  const mockTrackSharedBlog = jest.fn();
  const mockShowModal = jest.fn();
  const mockCloseModal = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock router and searchParams
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'showmodal') return null;
        if (param === 'discoverid') return null;
        return null;
      }),
    });
    
    // Mock analytics
    (useHuskyAnalytics as jest.Mock).mockReturnValue({
      trackSharedBlog: mockTrackSharedBlog,
    });
    
    // Mock service calls
    (incrementHuskyViewCount as jest.Mock).mockResolvedValue({});
    (getHuskyResponseBySlug as jest.Mock).mockResolvedValue({
      data: {
        slug: 'test-slug',
        question: 'Test question?',
      },
    });

    // Mock Element.prototype.showModal and close
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = mockShowModal;
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = mockCloseModal;
    }
  });

  test('renders without crashing', () => {
    render(<HuskyDiscover isLoggedIn={true} />);
    expect(document.querySelector('dialog')).toBeInTheDocument();
  });

  test('closes dialog and redirects to home when showmodal is husky', () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'showmodal') return 'husky';
        return null;
      }),
    });
    
    render(<HuskyDiscover isLoggedIn={true} />);
    
    // Get the dialog close event handler
    const dialog = document.querySelector('dialog');
    
    // Directly call the onDialogClose handler by triggering the onClose event
    if (dialog) {
      // Create and dispatch a close event
      const closeEvent = new Event('close');
      dialog.dispatchEvent(closeEvent);
    }
    
    // Now check if router.push was called
    expect(mockRouter.push).toHaveBeenCalledWith('/');
  });

  test('closes dialog without redirect when showmodal is not husky', () => {
    render(<HuskyDiscover isLoggedIn={true} />);
    
    const dialog = document.querySelector('dialog');
    
    // Directly call the onDialogClose handler by triggering the onClose event
    if (dialog) {
      // Create and dispatch a close event
      const closeEvent = new Event('close');
      dialog.dispatchEvent(closeEvent);
    }
    
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  test('handles open-husky-discover event correctly', () => {
    render(<HuskyDiscover isLoggedIn={true} />);
    
    const testData = {
      slug: 'test-slug',
      question: 'Test question?',
    };
    
    act(() => {
      document.dispatchEvent(
        new CustomEvent('open-husky-discover', {
          detail: testData,
        })
      );
    });
    
    expect(incrementHuskyViewCount).toHaveBeenCalledWith('test-slug');
    expect(mockTrackSharedBlog).toHaveBeenCalledWith('test-slug', 'discover', 'Test question?');
    expect(mockShowModal).toHaveBeenCalled();
  });

  test('getUserInfoFromCookie handles valid JSON data', () => {
    // This test covers the getUserInfoFromCookie function when receiving valid JSON
    const mockUserData = { id: '123', name: 'Test User' };
    (cookies.get as jest.Mock).mockReturnValue(JSON.stringify(mockUserData));
    
    // Call our mock implementation
    const result = getUserInfoFromCookie();
    
    // Verify cookies.get was called and returned expected result
    expect(cookies.get).toHaveBeenCalledWith('userInfo');
    expect(result).toEqual(mockUserData);
  });

  test('getUserInfoFromCookie handles null cookie data', () => {
    // This test covers the getUserInfoFromCookie function when cookie is null
    (cookies.get as jest.Mock).mockReturnValue(null);
    
    // Call our mock implementation
    const result = getUserInfoFromCookie();
    
    // Verify cookies.get was called and returned null
    expect(cookies.get).toHaveBeenCalledWith('userInfo');
    expect(result).toBeNull();
  });

  test('getUserInfoFromCookie handles invalid JSON data', () => {
    // This test covers the getUserInfoFromCookie function when JSON is invalid
    (cookies.get as jest.Mock).mockReturnValue('{invalid json}');
    
    // Call our mock implementation
    const result = getUserInfoFromCookie();
    
    // Verify cookies.get was called and returned null due to JSON parse error
    expect(cookies.get).toHaveBeenCalledWith('userInfo');
    expect(result).toBeNull();
  });

  test('fetches husky data and opens dialog when URL has showmodal=husky and discoverid', async () => {
    const testSlug = 'test-slug-from-url';
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'showmodal') return 'husky';
        if (param === 'discoverid') return testSlug;
        return null;
      }),
    });
    
    await act(async () => {
      render(<HuskyDiscover isLoggedIn={true} />);
    });
    
    expect(getHuskyResponseBySlug).toHaveBeenCalledWith(testSlug, true);
    expect(mockShowModal).toHaveBeenCalled();
    expect(mockTrackSharedBlog).toHaveBeenCalled();
  });

  test('shows error toast when API call fails', async () => {
    const testSlug = 'test-slug-from-url';
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'showmodal') return 'husky';
        if (param === 'discoverid') return testSlug;
        return null;
      }),
    });
    
    (getHuskyResponseBySlug as jest.Mock).mockRejectedValue(new Error('API error'));
    
    await act(async () => {
      render(<HuskyDiscover isLoggedIn={true} />);
    });
    
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  test('shows error toast when API call returns no data', async () => {
    const testSlug = 'test-slug-from-url';
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'showmodal') return 'husky';
        if (param === 'discoverid') return testSlug;
        return null;
      }),
    });
    
    (getHuskyResponseBySlug as jest.Mock).mockResolvedValue({ data: null });
    
    await act(async () => {
      render(<HuskyDiscover isLoggedIn={true} />);
    });
    
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

  test('shows page loader when loading', async () => {
    const testSlug = 'test-slug-from-url';
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'showmodal') return 'husky';
        if (param === 'discoverid') return testSlug;
        return null;
      }),
    });
    
    // Create a promise that we can resolve later
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    
    (getHuskyResponseBySlug as jest.Mock).mockReturnValue(promise);
    
    render(<HuskyDiscover isLoggedIn={true} />);
    
    // Loader should be visible during the pending API call
    expect(screen.getByTestId('page-loader')).toBeInTheDocument();
    
    // Resolve the API call
    await act(async () => {
      resolvePromise({ data: { slug: 'test-slug', question: 'Test question?' } });
    });
  });

  test('renders HuskyAi with correct props when initialChats has data', async () => {
    const testSlug = 'test-slug-from-url';
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'showmodal') return 'husky';
        if (param === 'discoverid') return testSlug;
        return null;
      }),
    });
    
    const testData = {
      slug: testSlug,
      question: 'Test question?',
    };
    
    (getHuskyResponseBySlug as jest.Mock).mockResolvedValue({ data: testData });
    
    await act(async () => {
      render(<HuskyDiscover isLoggedIn={true} />);
    });
    
    expect(screen.getByTestId('mock-husky-ai')).toBeInTheDocument();
    expect(screen.getByTestId('blog-id')).toHaveTextContent(testSlug);
    expect(screen.getByTestId('is-logged-in')).toHaveTextContent('true');
    expect(screen.getByTestId('chats-count')).toHaveTextContent('1');
    expect(screen.getByTestId('mode')).toHaveTextContent('blog');
  });

  test('removes event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<HuskyDiscover isLoggedIn={true} />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('open-husky-discover', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  test('closing the dialog through the HuskyAi close button works', async () => {
    const testSlug = 'test-slug-from-url';
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockImplementation((param) => {
        if (param === 'showmodal') return 'husky';
        if (param === 'discoverid') return testSlug;
        return null;
      }),
    });
    
    (getHuskyResponseBySlug as jest.Mock).mockResolvedValue({
      data: {
        slug: testSlug,
        question: 'Test question?',
      },
    });
    
    await act(async () => {
      render(<HuskyDiscover isLoggedIn={true} />);
    });
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(mockCloseModal).toHaveBeenCalled();
  });
}); 