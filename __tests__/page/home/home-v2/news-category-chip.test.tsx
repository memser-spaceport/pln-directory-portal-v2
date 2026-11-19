import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import {
  getNewsCategoryChip,
  NewsTagChips,
} from '@/components/page/home/TeamNews/components/NewsTagChips/NewsTagChips';

let mockFlag = false;
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  get SHOW_NEWS_PREFERENCES() {
    return mockFlag;
  },
}));
jest.mock('@/services/team-news/hooks/useNewsTopicSlugs', () => ({ useNewsTopicSlugs: () => new Set(['defi']) }));

describe('the category tag on a news card (LAB-3266)', () => {
  beforeEach(() => {
    mockFlag = false;
  });

  it('names only the News preferences category tags', () => {
    expect(getNewsCategoryChip('FUNDING')).toBe('funding');
    expect(getNewsCategoryChip('LAUNCH')).toBe('launch');
    expect(getNewsCategoryChip('ANNOUNCEMENT')).toBe('announcement');
    expect(getNewsCategoryChip('OTHER')).toBeNull();
    expect(getNewsCategoryChip('PARTNERSHIP')).toBeNull();
    expect(getNewsCategoryChip(undefined)).toBeNull();
  });

  it('shows the category first, as a label, before the tag links', () => {
    render(<NewsTagChips tags={['defi']} eventType="FUNDING" variant="card" ungated onSelect={() => {}} />);

    const items = screen.getAllByRole('listitem').map((li) => li.textContent);
    expect(items).toEqual(['#funding', '#defi']);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['#defi']);
  });

  it('shows the category with no other tags', () => {
    mockFlag = true;
    render(<NewsTagChips tags={[]} eventType="LAUNCH" variant="detail" />);

    expect(screen.getByTestId('news-category-chip')).toHaveTextContent('#launch');
  });

  it('shows no category chip for Other', () => {
    render(<NewsTagChips tags={['defi']} eventType="OTHER" variant="card" ungated onSelect={() => {}} />);

    expect(screen.queryByTestId('news-category-chip')).not.toBeInTheDocument();
  });

  it('stays hidden where the tag row is hidden', () => {
    const { container } = render(<NewsTagChips tags={['defi']} eventType="FUNDING" variant="card" />);

    expect(container).toBeEmptyDOMElement();
  });
});
