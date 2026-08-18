import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockCount = jest.fn<number | undefined, []>(() => undefined);
const mockOnChipClicked = jest.fn();

// Mocked at the hook boundary, and that is not optional here: jest.setup.js
// stubs useQuery globally with a version that takes no arguments and therefore
// IGNORES `select`. Unmocked, useTeamNewsCount would return `{ memberInfo: {} }`
// — a truthy object — and this chip would render "NaN new posts" while every
// "it renders" assertion still passed.
jest.mock('@/services/team-news/hooks/useTeamNewsCounts', () => ({
  useTeamNewsCount: () => mockCount(),
}));

jest.mock('@/analytics/team-news.analytics', () => ({
  useTeamNewsAnalytics: () => ({
    onTeamNewsCountChipClicked: (...a: unknown[]) => mockOnChipClicked(...a),
  }),
}));

import { TeamNewsCountChip } from '@/components/page/team-news/TeamNewsCountChip';

describe('TeamNewsCountChip', () => {
  const onOpen = jest.fn();

  const renderChip = () =>
    render(<TeamNewsCountChip teamUid="team-1" teamName="Acme Labs" source="teams-grid" onOpen={onOpen} />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockCount.mockReturnValue(undefined);
  });

  it('renders nothing while the count is unknown', () => {
    const { container } = renderChip();
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing at zero — "0 new posts" is an empty promise', () => {
    mockCount.mockReturnValue(0);
    const { container } = renderChip();
    expect(container).toBeEmptyDOMElement();
  });

  it('says "1 new post" in the singular', () => {
    mockCount.mockReturnValue(1);
    renderChip();
    expect(screen.getByRole('button')).toHaveTextContent('1 new post');
    expect(screen.getByRole('button')).not.toHaveTextContent('1 new posts');
  });

  it('says "N new posts" in the plural', () => {
    mockCount.mockReturnValue(3);
    renderChip();
    expect(screen.getByRole('button')).toHaveTextContent('3 new posts');
  });

  it('leads its accessible name with the visible text (WCAG 2.5.3)', () => {
    mockCount.mockReturnValue(3);
    renderChip();
    const label = screen.getByRole('button').getAttribute('aria-label') ?? '';
    expect(label.startsWith('3 new posts')).toBe(true);
    expect(label).toContain('Acme Labs');
  });

  it('opens the team news and reports the count it was claiming', async () => {
    mockCount.mockReturnValue(3);
    renderChip();

    await userEvent.click(screen.getByRole('button'));

    expect(onOpen).toHaveBeenCalledWith('team-1', 'Acme Labs');
    expect(mockOnChipClicked).toHaveBeenCalledWith('team-1', 'Acme Labs', 3, 'teams-grid');
  });

  it('takes the click away from the card link it sits inside', async () => {
    mockCount.mockReturnValue(3);
    const onCardClick = jest.fn();
    const onLinkClick = jest.fn();

    render(
      // The teams grid's shape: a wrapper with its own onClick, wrapping a link,
      // wrapping the card. Both must stay silent when the chip is what was hit,
      // or clicking "3 new posts" also navigates to the team profile.
      <div onClick={onCardClick}>
        {/* A bare anchor rather than next/link: what's under test is whether the
            click reaches an ancestor at all, and the href is beside the point. */}
        <a href="#" onClick={onLinkClick}>
          <TeamNewsCountChip teamUid="team-1" teamName="Acme Labs" source="teams-grid" onOpen={onOpen} />
        </a>
      </div>,
    );

    await userEvent.click(screen.getByRole('button'));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onCardClick).not.toHaveBeenCalled();
    expect(onLinkClick).not.toHaveBeenCalled();
  });
});
