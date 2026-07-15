import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ImpactSummaryStrip } from '@/components/page/gantry/shared/ImpactSummaryStrip';
import { ImpactDetailSection } from '@/components/page/gantry/shared/ImpactDetailSection';
import type { GantryItem, GantryPinner } from '@/services/gantry/types';

jest.mock('@/services/gantry/hooks/useGantryPinUpdate', () => ({
  useGantryPinUpdate: () => ({ mutate: jest.fn(), isPending: false }),
}));
const useGantryItemPinsMock = jest.fn(() => ({ data: undefined }));
jest.mock('@/services/gantry/hooks/useGantryItemPins', () => ({
  useGantryItemPins: (...args: unknown[]) => useGantryItemPinsMock(...(args as [])),
}));
jest.mock('@/analytics/gantry.analytics', () => ({
  useGantryAnalytics: () => ({ onItemImpactRated: jest.fn() }),
}));

const pinner = (name: string, impact: number | null, note: string | null = null): GantryPinner =>
  ({
    uid: `pin-${name}`,
    note,
    impact,
    createdAt: '',
    releasedAt: null,
    member: { uid: `m-${name}`, name, imageUrl: null },
  }) as GantryPinner;

const item = (overrides: Partial<GantryItem> = {}): GantryItem =>
  ({
    uid: 'item-1',
    title: 'Item',
    stage: 'IDEA',
    objectives: [],
    createdByUid: 'author-1',
    createdBy: { uid: 'author-1', name: 'Ada Author', imageUrl: null },
    pinCount: 2,
    viewerHasPinned: false,
    viewerPinNote: null,
    authorImpact: 4,
    authorImpactReasoning: 'Moves the onboarding goal directly',
    avgImpact: 4.2,
    impactCount: 5,
    impactDistribution: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 2 },
    viewerImpact: null,
    pins: [pinner('Bea Booster', 5, 'why now'), pinner('Cal Legacy', null)],
    ...overrides,
  }) as GantryItem;

describe('ImpactSummaryStrip (board card)', () => {
  it('shows the public aggregate to everyone; avatar stack only to curators', () => {
    const { rerender } = render(<ImpactSummaryStrip item={item()} canCurate={false} />);
    expect(screen.getByText('4.2')).toBeInTheDocument();
    expect(screen.getByText(/5 ratings/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Rated by/)).not.toBeInTheDocument();
    expect(screen.queryByText(/team-only/i)).not.toBeInTheDocument();

    rerender(<ImpactSummaryStrip item={item()} canCurate />);
    expect(screen.getByLabelText('Rated by 2 members (team-only)')).toBeInTheDocument();
  });

  it('renders nothing for legacy items (impactCount 0)', () => {
    const { container } = render(
      <ImpactSummaryStrip item={item({ impactCount: 0, avgImpact: null, impactDistribution: null })} canCurate />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('never shows notes on the card', () => {
    render(<ImpactSummaryStrip item={item()} canCurate />);
    expect(screen.queryByText('why now')).not.toBeInTheDocument();
  });
});

describe('ImpactDetailSection (drawer/page)', () => {
  it('curators see the rater list with author row and legacy "No rating" rows; members do not', () => {
    const { rerender } = render(<ImpactDetailSection item={item()} canCurate isAuthor={false} frozen={false} />);
    expect(screen.getByText('Ada Author')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Bea Booster')).toBeInTheDocument();
    expect(screen.getByText('5 · Critical')).toBeInTheDocument();
    expect(screen.getByText('No rating')).toBeInTheDocument(); // legacy pin
    expect(screen.getByText('why now')).toBeInTheDocument();

    rerender(<ImpactDetailSection item={item()} canCurate={false} isAuthor={false} frozen={false} />);
    expect(screen.queryByText('Bea Booster')).not.toBeInTheDocument();
    expect(screen.getByText('4.2')).toBeInTheDocument(); // aggregate stays public
  });

  it('shows the editable own-rating row only to an active booster, read-only when frozen', () => {
    const { rerender } = render(
      <ImpactDetailSection
        item={item({ viewerHasPinned: true, viewerImpact: 3 })}
        canCurate={false}
        isAuthor={false}
        frozen={false}
      />,
    );
    expect(screen.getByText('Your rating')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')[0]).toBeEnabled();

    rerender(
      <ImpactDetailSection
        item={item({ viewerHasPinned: true, viewerImpact: 3, stage: 'SHIPPED' })}
        canCurate={false}
        isAuthor={false}
        frozen
      />,
    );
    expect(screen.getAllByRole('radio')[0]).toBeDisabled();

    rerender(<ImpactDetailSection item={item()} canCurate={false} isAuthor={false} frozen={false} />);
    expect(screen.queryByText('Your rating')).not.toBeInTheDocument();
  });

  it('offers "Add your rating" to a legacy booster with no rating yet', () => {
    render(
      <ImpactDetailSection
        item={item({ viewerHasPinned: true, viewerImpact: null })}
        canCurate={false}
        isAuthor={false}
        frozen={false}
      />,
    );
    expect(screen.getByText('Add your rating')).toBeInTheDocument();
  });

  it('reasoning is visible to curators and the author, hidden once objectives are assigned', () => {
    const withObjectives = item({ objectives: [{ uid: 'o1', order: 1, title: 'Goal' }] });
    const { rerender } = render(<ImpactDetailSection item={item()} canCurate={false} isAuthor frozen={false} />);
    expect(screen.getByText('Moves the onboarding goal directly')).toBeInTheDocument();

    rerender(<ImpactDetailSection item={item()} canCurate={false} isAuthor={false} frozen={false} />);
    expect(screen.queryByText('Moves the onboarding goal directly')).not.toBeInTheDocument();

    rerender(<ImpactDetailSection item={withObjectives} canCurate isAuthor frozen={false} />);
    expect(screen.queryByText('Moves the onboarding goal directly')).not.toBeInTheDocument();
  });

  it('renders hostile note/reasoning text as literal text, never HTML', () => {
    const hostile = '<img src=x onerror=alert(1)>';
    const { container } = render(
      <ImpactDetailSection
        item={item({ authorImpactReasoning: hostile, pins: [pinner('Eve', 4, hostile)] })}
        canCurate
        isAuthor
        frozen={false}
      />,
    );
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getAllByText(hostile).length).toBeGreaterThanOrEqual(2);
  });

  it('never fetches per-item pins when they are embedded (N+1 guard)', () => {
    render(<ImpactDetailSection item={item()} canCurate isAuthor={false} frozen={false} />);
    expect(useGantryItemPinsMock).toHaveBeenCalledWith('item-1', false);
  });
});
