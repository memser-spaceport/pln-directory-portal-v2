const redirectMock = jest.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const getCookiesFromHeadersMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}));
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: () => getCookiesFromHeadersMock(),
}));
jest.mock('@/components/page/aligement-assets/kudos-board/kudos-board-component', () => ({
  __esModule: true,
  default: () => <div>kudos board</div>,
}));

import KudosBoardPage from '@/app/alignment-asset/kudos/page';

describe('Kudos page — guest access is blocked at the route, not just the nav', () => {
  beforeEach(() => jest.clearAllMocks());

  test('redirects a guest (not logged into LabOS) away from /alignment-asset/kudos', async () => {
    getCookiesFromHeadersMock.mockResolvedValue({ isLoggedIn: false });

    await expect(KudosBoardPage()).rejects.toThrow('REDIRECT:/alignment-asset');
    expect(redirectMock).toHaveBeenCalledWith('/alignment-asset');
  });

  test('renders the board for any logged-in LabOS user, PLAA roster or not', async () => {
    getCookiesFromHeadersMock.mockResolvedValue({ isLoggedIn: true });

    const result = await KudosBoardPage();
    expect(result).toBeTruthy();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
