import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PostNewsButton } from '@/components/page/team-details/TeamNews/PostNewsModal/PostNewsButton';
import { getUiFlag, setUiFlag } from '@/utils/uiFlags';

jest.mock('@/utils/uiFlags', () => ({
  getUiFlag: jest.fn(),
  setUiFlag: jest.fn(),
}));

const mockGetUiFlag = getUiFlag as jest.MockedFunction<typeof getUiFlag>;
const mockSetUiFlag = setUiFlag as jest.MockedFunction<typeof setUiFlag>;

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver;
});

describe('PostNewsButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUiFlag.mockResolvedValue(false);
    mockSetUiFlag.mockResolvedValue(undefined);
  });

  it('shows the first-visit tooltip until Got it is pressed', async () => {
    const onPost = jest.fn();
    render(<PostNewsButton teamName="Protocol Labs" memberUid="member-1" onPost={onPost} />);

    expect(await screen.findByRole('button', { name: 'Got it' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));

    await waitFor(() => expect(mockSetUiFlag).toHaveBeenCalledWith('team_news_post_tip_dismissed_member-1'));
  });

  it('dismisses the tooltip when Post news is clicked', async () => {
    const onPost = jest.fn();
    render(<PostNewsButton teamName="Protocol Labs" memberUid="member-1" onPost={onPost} />);

    await screen.findByRole('button', { name: 'Got it' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Post news' }));
    });

    expect(mockSetUiFlag).toHaveBeenCalledWith('team_news_post_tip_dismissed_member-1');
    expect(onPost).toHaveBeenCalled();
  });
});
