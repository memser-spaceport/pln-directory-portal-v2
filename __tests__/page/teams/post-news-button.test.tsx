import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { PostNewsButton } from '@/components/page/team-details/TeamNews/PostNewsModal/PostNewsButton';

/**
 * The tip's storage lives in `useOneTimeCallout` — local cache, member record
 * and the reconciliation between them — and is covered by
 * `__tests__/hooks/use-one-time-callout.test.tsx`. Here the hook is a fake that
 * is open until dismissed, so these stay tests of the button.
 */
const mockDismiss = jest.fn();
const mockCalloutKey = jest.fn();

jest.mock('@/hooks/useOneTimeCallout', () => {
  const { useState } = jest.requireActual('react');
  return {
    useOneTimeCallout: (key: string) => {
      mockCalloutKey(key);
      const [dismissedHere, setDismissedHere] = useState(false);
      return {
        open: !dismissedHere,
        dismiss: () => {
          mockDismiss(key);
          setDismissedHere(true);
        },
      };
    },
  };
});

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
  });

  it('shows the first-visit tooltip until Got it is pressed', async () => {
    render(<PostNewsButton teamName="Protocol Labs" onPost={jest.fn()} />);

    expect(await screen.findByRole('button', { name: 'Got it' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));

    await waitFor(() => expect(mockDismiss).toHaveBeenCalledWith('team_news_post_tip'));
    expect(screen.queryByRole('button', { name: 'Got it' })).not.toBeInTheDocument();
  });

  it('dismisses the tooltip when Post news is clicked', async () => {
    const onPost = jest.fn();
    render(<PostNewsButton teamName="Protocol Labs" onPost={onPost} />);

    await screen.findByRole('button', { name: 'Got it' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Post news' }));
    });

    expect(mockDismiss).toHaveBeenCalledWith('team_news_post_tip');
    expect(onPost).toHaveBeenCalled();
  });

  // The exact string is the contract with the member's stored record: change it
  // and every member who already dismissed the tip sees it again.
  it('asks about the tip under its published key', () => {
    render(<PostNewsButton teamName="Protocol Labs" onPost={jest.fn()} />);

    expect(mockCalloutKey).toHaveBeenCalledWith('team_news_post_tip');
  });
});
