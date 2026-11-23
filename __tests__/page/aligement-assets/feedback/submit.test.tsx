import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import FeedbackPage from '@/components/page/aligement-assets/feedback/feedback-page';
import { emptyRoadmap, item } from './__fixtures__/feedback.fixtures';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  usePathname: () => '/alignment-asset/feedback',
  useSearchParams: () => new URLSearchParams(),
}));
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

const mockCreate = jest.fn();
jest.mock('@/services/plaa/feedback/useFeedback', () => ({
  useFeedbackMe: () => ({ data: { is_admin: false } }),
  useFeedbackList: () => ({ data: { items: [item()] }, isLoading: false, isError: false, refetch: jest.fn() }),
  useFeedbackRoadmap: () => ({ data: emptyRoadmap, isLoading: false, isError: false, refetch: jest.fn() }),
  useFeedbackTriage: () => ({ data: { items: [] }, isLoading: false, isError: false, refetch: jest.fn() }),
  useVote: () => ({ mutate: jest.fn() }),
  useCreateFeedback: () => ({ mutate: mockCreate, isPending: false, error: null }),
  useChangeStatus: () => ({ mutate: jest.fn() }),
  useRetryLinear: () => ({ mutate: jest.fn(), isPending: false, variables: undefined }),
  useAdminUpdate: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/analytics/plaa-feedback.analytics', () => ({
  usePlaaFeedbackAnalytics: () => new Proxy({}, { get: () => jest.fn() }),
}));

const DESCRIPTION = 'This description is comfortably longer than twenty characters.';

function submit(type: RegExp, descriptionLabel: RegExp) {
  render(<FeedbackPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
  fireEvent.click(screen.getByRole('button', { name: type }));
  fireEvent.change(screen.getByLabelText(/^Title$/), { target: { value: 'A good clear title' } });
  fireEvent.change(screen.getByLabelText(descriptionLabel), { target: { value: DESCRIPTION } });
  fireEvent.click(screen.getByRole('button', { name: /^Submit$/ }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCreate.mockImplementation((_values: unknown, options: { onSuccess: (saved: { id: string }) => void }) =>
    options.onSuccess({ id: 'new-item' }),
  );
});

describe('after a submission is saved', () => {
  it("takes the member to their new idea's page and closes the form", () => {
    submit(/New feature/, /Describe the new feature/);

    expect(mockCreate.mock.calls[0][0]).toMatchObject({ type: 'feature', description: DESCRIPTION });
    expect(mockPush).toHaveBeenCalledWith('/alignment-asset/feedback/new-item');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('takes the member to My submissions after a bug, which has no public page', () => {
    submit(/Bug/, /What happened/);

    expect(mockCreate.mock.calls[0][0]).toMatchObject({ type: 'bug' });
    expect(mockReplace.mock.calls[0][0]).toContain('tab=mine');
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('when the submission is not saved', () => {
  it('keeps the form open with what the member wrote, and goes nowhere', () => {
    mockCreate.mockImplementation(
      (_values: unknown, options: { onError?: (error: Error) => void; onSettled?: () => void }) => {
        options.onError?.(new Error('upstream down'));
        options.onSettled?.();
      },
    );

    submit(/New feature/, /Describe the new feature/);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/Describe the new feature/)).toHaveValue(DESCRIPTION);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
