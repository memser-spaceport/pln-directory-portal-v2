import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { KudosGuestCta } from '@/components/page/aligement-assets/kudos-board/kudos-guest-cta';

describe('KudosGuestCta', () => {
  beforeEach(() => jest.clearAllMocks());

  test('sends the visitor to the login hash on the page they were already on', () => {
    render(<KudosGuestCta />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Same-page #login hash, so the login modal opens here rather than
    // navigating away and losing the destination.
    expect(pushMock).toHaveBeenCalledTimes(1);
    const [url, opts] = pushMock.mock.calls[0];
    expect(url).toMatch(/#login$/);
    expect(opts).toEqual({ scroll: false });
  });
});
