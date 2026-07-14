import { render, waitFor } from '@testing-library/react';
import HuskyDiscover from '@/components/page/home/husky-discover';
import { getHuskyResponseBySlug } from '@/services/discovery.service';
import { toast } from '@/components/core/ToastContainer';
import { TOAST_MESSAGES } from '@/utils/constants';

const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, prefetch: jest.fn() }),
  usePathname: () => '/home',
  useSearchParams: () => mockSearchParams,
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/services/discovery.service', () => ({
  getHuskyResponseBySlug: jest.fn(),
  incrementHuskyViewCount: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/analytics/husky.analytics', () => ({
  useHuskyAnalytics: () => ({ trackSharedBlog: jest.fn() }),
}));

jest.mock('@/components/core/husky/husky-ai', () => ({
  __esModule: true,
  default: () => <div data-testid="husky-ai" />,
}));

jest.mock('@/components/core/page-loader', () => ({
  __esModule: true,
  default: () => <div data-testid="page-loader" />,
}));

const mockGetHuskyResponseBySlug = getHuskyResponseBySlug as jest.Mock;

describe('HuskyDiscover shared-link handling', () => {
  const showModalMock = jest.fn();

  beforeAll(() => {
    // jsdom has no <dialog> implementation
    HTMLDialogElement.prototype.showModal = showModalMock;
    HTMLDialogElement.prototype.close = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('opens the dialog without any toast for a valid shared link', async () => {
    mockSearchParams = new URLSearchParams('showmodal=husky&discoverid=live-slug');
    mockGetHuskyResponseBySlug.mockResolvedValue({ data: { question: 'Q', answer: 'A' } });

    render(<HuskyDiscover isLoggedIn={false} />);

    await waitFor(() => expect(showModalMock).toHaveBeenCalled());
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows the expired-link message and strips the params for a stale slug', async () => {
    mockSearchParams = new URLSearchParams('showmodal=husky&discoverid=dead-slug');
    mockGetHuskyResponseBySlug.mockResolvedValue({ isError: true, status: 404, message: null });

    render(<HuskyDiscover isLoggedIn={false} />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.HUSKY_SHARED_LINK_EXPIRED, {
        toastId: 'husky-discover',
      }),
    );
    expect(mockReplace).toHaveBeenCalledWith('/home');
    expect(showModalMock).not.toHaveBeenCalled();
  });

  it('shows the retryable message on a network failure', async () => {
    mockSearchParams = new URLSearchParams('showmodal=husky&discoverid=some-slug');
    mockGetHuskyResponseBySlug.mockRejectedValue(new Error('network down'));

    render(<HuskyDiscover isLoggedIn={false} />);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(TOAST_MESSAGES.HUSKY_SHARED_LINK_FAILED, {
        toastId: 'husky-discover',
      }),
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('silently cleans the URL when showmodal=husky has no discoverid', async () => {
    mockSearchParams = new URLSearchParams('showmodal=husky');

    render(<HuskyDiscover isLoggedIn={false} />);

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/home'));
    expect(mockGetHuskyResponseBySlug).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
