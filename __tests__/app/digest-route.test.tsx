import DigestRoute, { metadata } from '@/app/digest/page';
import { DigestErrorState } from '@/components/page/digest/DigestErrorState';
import { DigestPage } from '@/components/page/digest/DigestPage';

const exchangeDigestLink = jest.fn();
const getDigestIssuePage = jest.fn();
jest.mock('@/services/digest/digest.service', () => ({
  exchangeDigestLink: (...args: unknown[]) => exchangeDigestLink(...args),
  getDigestIssuePage: (...args: unknown[]) => getDigestIssuePage(...args),
}));
let cookies: { authToken: unknown; isLoggedIn: boolean };
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: async () => cookies }));
jest.mock('@/components/page/digest/DigestPage', () => ({ DigestPage: () => null }));
jest.mock('@/components/page/digest/DigestErrorState', () => ({ DigestErrorState: () => null }));

const PAGE = { frequency: 'weekly', stories: [] };
const route = (params: Record<string, string | string[]>) => DigestRoute({ searchParams: Promise.resolve(params) });

/** LAB-3351: `/digest` reads one issue by id; an email link's token is swapped for that id first. */
describe('/digest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cookies = { authToken: '', isLoggedIn: false };
    exchangeDigestLink.mockResolvedValue({ issueUid: 'iss-1' });
    getDigestIssuePage.mockResolvedValue({ data: PAGE });
  });

  it('swaps an email link for its issue and reads it signed out, with no session', async () => {
    const page = await route({ t: 'tok' });
    expect(exchangeDigestLink).toHaveBeenCalledWith('tok', undefined);
    expect(getDigestIssuePage).toHaveBeenCalledWith('iss-1', undefined);
    expect(page.type).toBe(DigestPage);
    expect(page.props).toEqual({ issueUid: 'iss-1', data: PAGE, isLoggedIn: false });
    expect(JSON.stringify(page.props)).not.toContain('tok');
  });

  it('passes the send time of an older Past issues link to the swap, and nothing else as one', async () => {
    await route({ t: 'tok', issue: '2026-11-12T09:00:00.000Z' });
    expect(exchangeDigestLink).toHaveBeenLastCalledWith('tok', '2026-11-12T09:00:00.000Z');
    await route({ t: 'tok', issue: 'iss-9' });
    expect(exchangeDigestLink).toHaveBeenLastCalledWith('tok', undefined);
  });

  it('reads an issue id with the reader’s session, without a swap', async () => {
    cookies = { authToken: 'jwt', isLoggedIn: true };
    const page = await route({ issue: 'iss-7' });
    expect(exchangeDigestLink).not.toHaveBeenCalled();
    expect(getDigestIssuePage).toHaveBeenCalledWith('iss-7', 'jwt');
    expect(page.props).toMatchObject({ issueUid: 'iss-7', isLoggedIn: true });
  });

  it.each([['expired'], ['invalid'], ['unavailable']])('shows %s for a link the swap refuses', async (error) => {
    exchangeDigestLink.mockResolvedValue({ error });
    const page = await route({ t: 'tok' });
    expect(page.type).toBe(DigestErrorState);
    expect(page.props).toEqual({ error });
    expect(getDigestIssuePage).not.toHaveBeenCalled();
  });

  it('shows the error of a read that fails, such as an unknown issue', async () => {
    getDigestIssuePage.mockResolvedValue({ error: 'invalid' });
    const page = await route({ issue: 'nope' });
    expect(page.type).toBe(DigestErrorState);
    expect(page.props).toEqual({ error: 'invalid' });
  });

  it('is invalid with neither a link nor an issue, or with repeated parameters', async () => {
    const cases: Record<string, string | string[]>[] = [{}, { t: '' }, { issue: ['a', 'b'] }];
    for (const params of cases) {
      const page = await route(params);
      expect(page.props).toEqual({ error: 'invalid' });
    }
    expect(getDigestIssuePage).not.toHaveBeenCalled();
  });

  it('keeps the page out of search engines and the link token out of the Referer', () => {
    expect(metadata).toMatchObject({ robots: { index: false, follow: false }, referrer: 'no-referrer' });
  });
});
