import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ArticlesSidebar from '@/components/page/founder-guides/ArticlesSidebar/ArticlesSidebar';
import s from '@/components/page/founder-guides/ArticlesSidebar/ArticlesSidebar.module.scss';

const mockUsePathname = jest.fn();
const mockUseGetArticles = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock('@/services/articles/hooks/useGetArticles', () => ({
  useGetArticles: () => mockUseGetArticles(),
}));

jest.mock('@/services/rbac/hooks/useFounderGuidesCreateAccess', () => ({
  useFounderGuidesCreateAccess: () => ({ canCreate: false }),
}));

jest.mock('@/analytics/founder-guides.analytics', () => ({
  useFounderGuidesAnalytics: () => ({
    trackSidebarSearch: jest.fn(),
    trackRequestGuideLinkClicked: jest.fn(),
  }),
}));

describe('ArticlesSidebar', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('highlights the selected article category in blue', () => {
    mockUsePathname.mockReturnValue('/founder-guides/safe-vs-equity');
    mockUseGetArticles.mockReturnValue({
      isLoading: false,
      byCategory: [
        {
          category: 'Legal & Finance',
          articles: [{ uid: 'a1', slugURL: 'safe-vs-equity', title: 'SAFE vs Equity', content: 'Guide content' }],
        },
        {
          category: 'Hiring',
          articles: [
            { uid: 'a2', slugURL: 'first-engineer', title: 'Hiring Your First Engineer', content: 'Guide content' },
          ],
        },
      ],
    });

    render(<ArticlesSidebar />);

    expect(screen.getByText('Legal & Finance').closest('button')).toHaveClass(s.categoryRowActive);
    expect(screen.getByText('Hiring').closest('button')).not.toHaveClass(s.categoryRowActive);
    expect(screen.getByRole('link', { name: 'SAFE vs Equity' })).toHaveClass(s.articleRowActive);
  });
});
