import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import DigestRoute from '@/app/digest/page';
import { DIGEST_COPIED_MS, DigestCopyLink } from '@/components/page/digest/DigestCopyLink';
import { DigestHeader } from '@/components/page/digest/DigestHeader';
import { DigestShareLink, digestShareUrl } from '@/components/page/digest/DigestShareLink';

// LAB-3398 digest slice: Copy link beside the dateline copies /digest?issue=<issue>&ref=<own invite code>.

const mockInvite = jest.fn();
jest.mock('@/services/members/hooks/useMyInviteLink', () => ({ useMyInviteLink: (uid?: string) => mockInvite(uid) }));
const mockPage = jest.fn();
jest.mock('@/services/digest/digest.service', () => ({
  exchangeDigestLink: jest.fn(),
  getDigestIssuePage: (...args: unknown[]) => mockPage(...args),
}));
jest.mock('@/components/page/digest/DigestPage', () => ({ DigestPage: () => <p>digest page</p> }));
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: async () => ({ isLoggedIn: false }) }));

const URL = 'https://labos.example/digest?issue=iss-1&ref=abc123';
const setClipboard = (writeText?: jest.Mock) =>
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: writeText && { writeText } });
const press = () => act(async () => fireEvent.click(screen.getByRole('button')));

beforeEach(() => jest.clearAllMocks());

describe('DigestCopyLink', () => {
  it.each([undefined, null, ''])('shows nothing without a link (%p)', (url) => {
    const { container } = render(<DigestCopyLink url={url} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('copies the link as given, shows "Copied" for 2 s, then "Copy link" again', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    render(<DigestCopyLink url={URL} />);
    jest.useFakeTimers();
    await press();
    expect(writeText).toHaveBeenCalledWith(URL);
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Link copied');
    act(() => jest.advanceTimersByTime(DIGEST_COPIED_MS));
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    jest.useRealTimers();
  });

  it.each([
    ['blocks the write', jest.fn().mockRejectedValue(new Error('NotAllowedError'))],
    ['has no clipboard', undefined],
  ])('shows the link in a read-only field when the browser %s', async (_label, writeText) => {
    setClipboard(writeText);
    render(<DigestCopyLink url={URL} />);
    await press();
    expect(screen.getByRole('status')).toHaveTextContent('The link did not copy. Select the link and copy it.');
    expect(screen.getByRole('textbox', { name: 'Link to copy' })).toHaveValue(URL);
    expect(screen.getByRole('textbox', { name: 'Link to copy' })).toHaveAttribute('readonly');
  });
});

describe('DigestShareLink', () => {
  it('builds a fresh URL with only issue and ref', () => {
    const url = new window.URL(digestShareUrl('https://os.pl.xyz', 'iss 1', 'a+b'));
    expect(url.pathname).toBe('/digest');
    expect([...url.searchParams]).toEqual([
      ['issue', 'iss 1'],
      ['ref', 'a+b'],
    ]);
    expect(url.hash).toBe('');
  });

  it.each([
    ['signed out', undefined, { data: { inviteCode: 'old', inviteUrl: 'x' } }],
    ['loading', 'me', { data: undefined }],
    ['failed', 'me', { data: undefined, isError: true }],
  ])('shows nothing when %s', (_label, uid, state) => {
    mockInvite.mockReturnValue(state);
    const { container } = render(<DigestShareLink issueUid="iss-1" uid={uid} />);
    expect(mockInvite).toHaveBeenCalledWith(uid);
    expect(container).toBeEmptyDOMElement();
  });

  it('copies the reader’s own code, and drops it after sign-out or a switch of account', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    setClipboard(writeText);
    mockInvite.mockImplementation((uid?: string) => ({ data: uid && { inviteCode: `code-${uid}`, inviteUrl: 'x' } }));
    const { rerender } = render(<DigestShareLink issueUid="iss-1" uid="me" />);
    await press();
    expect(writeText).toHaveBeenLastCalledWith(`${window.location.origin}/digest?issue=iss-1&ref=code-me`);

    rerender(<DigestShareLink issueUid="iss-1" uid="other" />);
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    await press();
    expect(writeText).toHaveBeenLastCalledWith(`${window.location.origin}/digest?issue=iss-1&ref=code-other`);

    rerender(<DigestShareLink issueUid="iss-1" uid={undefined} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('DigestHeader', () => {
  it('shows the action beside the dateline', () => {
    render(
      <DigestHeader
        frequency="weekly"
        sentAt="2026-11-09T00:00:00Z"
        storyCount={5}
        firstName="Ada"
        action={<button>Copy link</button>}
      />,
    );
    expect(screen.getByText(/Weekly digest/)).toContainElement(screen.getByRole('button', { name: 'Copy link' }));
  });
});

describe('/digest with an incoming ref, signed out', () => {
  it('reads the issue with no session and ignores ref', async () => {
    mockPage.mockResolvedValue({ data: {} });
    render(await DigestRoute({ searchParams: Promise.resolve({ issue: 'iss-1', ref: 'abc123' }) }));
    expect(mockPage).toHaveBeenCalledWith('iss-1', undefined);
    expect(screen.getByText('digest page')).toBeInTheDocument();
  });
});
