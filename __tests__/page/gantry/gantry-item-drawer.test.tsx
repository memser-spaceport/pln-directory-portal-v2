import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { GantryItemDrawer } from '@/components/page/gantry/GantryItemDrawer/GantryItemDrawer';

const mockSetParams = jest.fn();
let mockItemId = '';

jest.mock('nuqs', () => ({
  useQueryStates: () => [{ itemId: mockItemId }, mockSetParams],
}));

jest.mock('@/components/common/Drawer/Drawer', () => ({
  Drawer: ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) =>
    isOpen ? (
      <div data-testid="drawer">
        <button type="button" onClick={onClose}>
          backdrop-close
        </button>
        {children}
      </div>
    ) : null,
}));

jest.mock('@/components/page/gantry/shared/GantryItemDetailContent', () => ({
  GantryItemDetailContent: ({
    uid,
    onDismiss,
    headerStart,
  }: {
    uid: string;
    onDismiss: () => void;
    headerStart?: React.ReactNode;
  }) => (
    <div data-testid="detail-content">
      {headerStart}
      <span>detail:{uid}</span>
      <button type="button" onClick={onDismiss}>
        dismiss
      </button>
    </div>
  ),
}));

describe('GantryItemDrawer', () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockItemId = '';
  });

  it('stays closed when itemId is empty', () => {
    mockItemId = '';
    render(<GantryItemDrawer />);
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('opens with detail content when itemId is set', () => {
    mockItemId = 'item-1';
    render(<GantryItemDrawer />);
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    expect(screen.getByText('detail:item-1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
  });

  it('clears itemId on close', () => {
    mockItemId = 'item-1';
    render(<GantryItemDrawer />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(mockSetParams).toHaveBeenCalledWith({ itemId: null }, { history: 'replace' });
  });
});
