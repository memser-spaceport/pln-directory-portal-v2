import {
  FEED_COMMENT_PARAM,
  feedCommentDomId,
  scrollToFeedComment,
} from '@/components/page/home/TeamNews/utils/feedCommentAnchor';

describe('feedCommentAnchor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('builds a stable DOM id and exposes the query param name', () => {
    expect(FEED_COMMENT_PARAM).toBe('comment');
    expect(feedCommentDomId('c-42')).toBe('feed-comment-c-42');
  });

  it('scrolls and briefly highlights when the row exists', () => {
    jest.useFakeTimers();
    const el = document.createElement('div');
    el.id = feedCommentDomId('c-1');
    document.body.appendChild(el);

    expect(scrollToFeedComment('c-1')).toBe(true);
    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(el.classList.contains('feed-comment-highlighted')).toBe(true);

    jest.advanceTimersByTime(3000);
    expect(el.classList.contains('feed-comment-highlighted')).toBe(false);
  });

  it('is a no-op when the row is missing', () => {
    const scrollSpy = Element.prototype.scrollIntoView as jest.Mock;
    scrollSpy.mockClear();
    expect(scrollToFeedComment('missing')).toBe(false);
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
