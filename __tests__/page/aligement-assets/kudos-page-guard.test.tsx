import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

const redirectMock = jest.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const getCookiesFromHeadersMock = jest.fn();
const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
  useRouter: () => ({ push: pushMock }),
}));
jest.mock('@/utils/next-helpers', () => ({
  getCookiesFromHeaders: () => getCookiesFromHeadersMock(),
}));
jest.mock('@/components/page/aligement-assets/kudos-board/kudos-board-component', () => ({
  __esModule: true,
  default: () => <div>kudos board</div>,
}));

import KudosBoardPage from '@/app/alignment-asset/kudos/page';

describe('Kudos page — guests get the sign-in path, never the board', () => {
  beforeEach(() => jest.clearAllMocks());

  test('a guest sees the sign-in CTA instead of the board', async () => {
    getCookiesFromHeadersMock.mockResolvedValue({ isLoggedIn: false });

    render(await KudosBoardPage());

    expect(screen.getByText(/sign in to see the kudos board/i)).toBeInTheDocument();
    // The board stays unmounted, so no kudos feed request is made for a guest.
    expect(screen.queryByText('kudos board')).not.toBeInTheDocument();
  });

  test('a guest is no longer bounced off the page', async () => {
    getCookiesFromHeadersMock.mockResolvedValue({ isLoggedIn: false });

    await KudosBoardPage();

    expect(redirectMock).not.toHaveBeenCalled();
  });

  test('renders the board for any logged-in LabOS user, PLAA roster or not', async () => {
    getCookiesFromHeadersMock.mockResolvedValue({ isLoggedIn: true });

    render(await KudosBoardPage());

    expect(screen.getByText('kudos board')).toBeInTheDocument();
    expect(screen.queryByText(/sign in to see the kudos board/i)).not.toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
