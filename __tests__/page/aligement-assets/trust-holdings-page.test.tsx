import TrustHoldingsPage from '@/app/alignment-asset/portfolio-holdings/page';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { getTrustHoldings } from '@/services/plaa/trust-holdings.service';
import { getCompletedBuybacks } from '@/services/plaa/rounds.service';

jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: jest.fn() }));
jest.mock('@/services/plaa/trust-holdings.service', () => ({ getTrustHoldings: jest.fn() }));
jest.mock('@/services/plaa/rounds.service', () => ({ getCompletedBuybacks: jest.fn() }));
jest.mock('@/components/page/aligement-assets/trust-holdings/trust-holdings', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

afterEach(() => jest.resetAllMocks());

test('forwards the member session and complete API history without truncating either series', async () => {
  const history = {
    quarterly: [{ label: 'Q1 2026' }],
    monthly: Array.from({ length: 18 }, (_, i) => ({ totalPlaa: i })),
  };
  jest
    .mocked(getCookiesFromHeaders)
    .mockResolvedValue({ authToken: 'test-member-session', isLoggedIn: true, userInfo: null, refreshToken: null });
  jest
    .mocked(getTrustHoldings)
    .mockResolvedValue({ data: history as Awaited<ReturnType<typeof getTrustHoldings>>['data'] });
  jest.mocked(getCompletedBuybacks).mockResolvedValue([]);

  const page = await TrustHoldingsPage();

  expect(getTrustHoldings).toHaveBeenCalledWith('test-member-session');
  expect(getCompletedBuybacks).toHaveBeenCalledWith('test-member-session');
  expect(page.props.data).toBe(history);
});

test('reports unavailable API data rather than substituting financial figures', async () => {
  jest
    .mocked(getCookiesFromHeaders)
    .mockResolvedValue({ authToken: null, isLoggedIn: false, userInfo: null, refreshToken: null });
  jest.mocked(getTrustHoldings).mockResolvedValue({ error: { message: 'API responded with 401: Unauthorized' } });
  jest.mocked(getCompletedBuybacks).mockResolvedValue([]);

  const page = await TrustHoldingsPage();

  expect(getTrustHoldings).toHaveBeenCalledWith(null);
  expect(page.type).toBe('div');
  expect(page.props.children).toBe('API responded with 401: Unauthorized');
});
