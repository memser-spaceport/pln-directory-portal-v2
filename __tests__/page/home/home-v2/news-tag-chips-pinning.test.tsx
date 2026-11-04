import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { NewsTagChips, pinActiveTags } from '@/components/page/home/TeamNews/components/NewsTagChips/NewsTagChips';

let mockFlag = false;
jest.mock('@/utils/news-categories', () => ({
  ...jest.requireActual('@/utils/news-categories'),
  get SHOW_NEWS_PREFERENCES() {
    return mockFlag;
  },
}));
const TOPICS = new Set(['ai', 'cryptographic-proofs', 'blockchain-security', 'frontier-tech']);
jest.mock('@/services/team-news/hooks/useNewsTopicSlugs', () => ({ useNewsTopicSlugs: () => TOPICS }));

// The story the lab-3070 env showed under #frontier-tech without the tag (2026-11-04).
const TAGS = ['ai', 'cryptographic-proofs', 'blockchain-security', 'frontier-tech'];
const chipNames = () => screen.getAllByRole('button').map((b) => b.textContent);

describe('a card shows the tags the stream is filtered by (LAB-3125)', () => {
  beforeEach(() => {
    mockFlag = false;
  });

  it('pinActiveTags puts the selected tags the story carries first, within the card limit', () => {
    expect(pinActiveTags(TAGS.slice(0, 3), TAGS, ['frontier-tech'])).toEqual([
      'frontier-tech',
      'ai',
      'cryptographic-proofs',
    ]);
    expect(pinActiveTags(TAGS.slice(0, 3), TAGS, ['frontier-tech', 'ai'])).toEqual([
      'frontier-tech',
      'ai',
      'cryptographic-proofs',
    ]);
    // A selected tag the story doesn't carry is not drawn.
    expect(pinActiveTags(TAGS.slice(0, 3), TAGS, ['robotics'])).toEqual(TAGS.slice(0, 3));
    // No filter: the card's usual three.
    expect(pinActiveTags(TAGS.slice(0, 3), TAGS, undefined)).toEqual(TAGS.slice(0, 3));
  });

  it('shows a 4th tag on the card when the stream is filtered by it (News preferences off)', () => {
    render(<NewsTagChips tags={TAGS} variant="card" ungated onSelect={() => {}} active={['frontier-tech']} />);

    expect(chipNames()).toEqual(['#frontier-tech', '#ai', '#cryptographic-proofs']);
    expect(screen.getByRole('button', { name: 'Stop filtering by #frontier-tech' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('does the same with News preferences on', () => {
    mockFlag = true;
    render(<NewsTagChips tags={TAGS} variant="card" onSelect={() => {}} active={['frontier-tech']} />);

    expect(chipNames()).toEqual(['#frontier-tech', '#ai', '#cryptographic-proofs']);
  });

  it('keeps the first three tags with no filter', () => {
    render(<NewsTagChips tags={TAGS} variant="card" ungated onSelect={() => {}} active={[]} />);

    expect(chipNames()).toEqual(['#ai', '#cryptographic-proofs', '#blockchain-security']);
  });
});
