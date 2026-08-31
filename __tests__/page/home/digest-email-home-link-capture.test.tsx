import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DigestEmailHomeLinkCapture } from '@/components/page/home/DigestEmailHomeLinkCapture';

const mockOnDigestEmailNewsLinkClicked = jest.fn();
const mockOnDigestEmailSeeAllNewsLinkClicked = jest.fn();
let search = '';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(search),
}));

jest.mock('@/analytics/forum.analytics', () => ({
  useForumAnalytics: () => ({
    onDigestEmailNewsLinkClicked: (...a: unknown[]) => mockOnDigestEmailNewsLinkClicked(...a),
    onDigestEmailSeeAllNewsLinkClicked: (...a: unknown[]) => mockOnDigestEmailSeeAllNewsLinkClicked(...a),
  }),
}));

describe('DigestEmailHomeLinkCapture', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    search = '';
  });

  it('fires news-clicked once for a digest news landing', () => {
    search = 'news=n1&utm_source=digest_email_news_link&target_uid=m1&position=0';
    const { rerender } = render(<DigestEmailHomeLinkCapture />);
    rerender(<DigestEmailHomeLinkCapture />);

    expect(mockOnDigestEmailNewsLinkClicked).toHaveBeenCalledTimes(1);
    expect(mockOnDigestEmailNewsLinkClicked).toHaveBeenCalledWith(
      expect.objectContaining({ utmSource: 'digest_email_news_link', news_id: 'n1', position: '0', targetUid: 'm1' }),
    );
    expect(mockOnDigestEmailSeeAllNewsLinkClicked).not.toHaveBeenCalled();
  });

  it('fires see-all-news-clicked for the digest footer link', () => {
    search = 'utm_source=digest_email_see_all_news_link&target_uid=m1';
    render(<DigestEmailHomeLinkCapture />);

    expect(mockOnDigestEmailSeeAllNewsLinkClicked).toHaveBeenCalledTimes(1);
    expect(mockOnDigestEmailNewsLinkClicked).not.toHaveBeenCalled();
  });

  it('does nothing without a digest utm', () => {
    search = 'news=n1';
    render(<DigestEmailHomeLinkCapture />);

    expect(mockOnDigestEmailNewsLinkClicked).not.toHaveBeenCalled();
    expect(mockOnDigestEmailSeeAllNewsLinkClicked).not.toHaveBeenCalled();
  });
});
