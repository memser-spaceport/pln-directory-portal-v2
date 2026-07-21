import { render } from '@testing-library/react';
import RatingContainer from '@/components/core/office-hours-rating/rating-container';
import { EVENTS } from '@/utils/constants';

jest.mock('@/services/office-hours.service', () => ({
  getFollowUps: jest.fn(),
  patchFollowup: jest.fn(),
}));

describe('RatingContainer TRIGGER_RATING_POPUP listener', () => {
  it('removes the same listener reference on unmount (no listener leak)', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(<RatingContainer isLoggedIn={false} authToken="" userInfo={{} as any} />);

    const added = addSpy.mock.calls.filter(([type]) => type === EVENTS.TRIGGER_RATING_POPUP);
    expect(added).toHaveLength(1);

    unmount();

    const removed = removeSpy.mock.calls.filter(([type]) => type === EVENTS.TRIGGER_RATING_POPUP);
    expect(removed).toHaveLength(1);
    // the leak: a fresh inline function was passed to removeEventListener,
    // so the original listener was never actually removed
    expect(removed[0][1]).toBe(added[0][1]);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
