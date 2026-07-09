import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { GantryDetailPage } from '@/components/page/gantry/GantryDetailPage';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/components/ui/BackButton/BackButton', () => ({
  BackButton: ({ to }: { to: string }) => <a href={to}>Back</a>,
}));

jest.mock('@/components/page/gantry/shared/GantryItemDetailContent', () => ({
  GantryItemDetailContent: ({ uid, variant, onDismiss }: { uid: string; variant: string; onDismiss: () => void }) => (
    <div>
      <span>
        {variant}:{uid}
      </span>
      <button type="button" onClick={onDismiss}>
        dismiss
      </button>
    </div>
  ),
}));

describe('GantryDetailPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders page variant detail for the uid', () => {
    render(<GantryDetailPage uid="item-99" />);
    expect(screen.getByText('page:item-99')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/gantry/dashboard');
  });

  it('navigates to dashboard on dismiss', () => {
    render(<GantryDetailPage uid="item-99" />);
    screen.getByRole('button', { name: 'dismiss' }).click();
    expect(mockPush).toHaveBeenCalledWith('/gantry/dashboard');
  });
});
