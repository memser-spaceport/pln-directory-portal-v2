import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { GlobalFeedback } from '@/components/core/GlobalFeedback';
import { useFeedbackDrawerStore } from '@/services/feedback/store';

let mockPathname = '/members';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

const mockCapture = jest.fn();
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: (...args: unknown[]) => mockCapture(...args) }),
}));

let mockPreferences: { memberPreferences: { showFeedbackButton?: boolean } } | undefined;
let mockPreferencesLoading = false;
jest.mock('@/services/members/hooks/useGetMemberPreferences', () => ({
  useGetMemberPreferences: () => ({ data: mockPreferences, isLoading: mockPreferencesLoading }),
}));

const mockSetShowFeedbackButton = jest.fn();
jest.mock('@/services/members/hooks/useSetShowFeedbackButton', () => ({
  useSetShowFeedbackButton: () => mockSetShowFeedbackButton,
}));

jest.mock('@/ai-apps-bridge/font-cache', () => ({
  scheduleFontCache: () => () => {},
}));

/* The drawer has its own suite; here only the props the host passes count. */
jest.mock('@/components/page/ai-apps/components/GiveAiAppFeedbackDialog', () => ({
  GiveAiAppFeedbackDialog: ({
    isOpen,
    variant,
    labosOnly,
    capture,
    pickViewport,
    onClose,
    onSent,
    onHideButton,
  }: {
    isOpen: boolean;
    variant?: string;
    labosOnly?: boolean;
    capture?: () => Promise<unknown>;
    pickViewport?: boolean;
    onClose: () => void;
    onSent?: () => void;
    onHideButton?: () => void;
  }) =>
    isOpen ? (
      <div
        data-testid="feedback-dialog"
        data-variant={variant}
        data-labos-only={labosOnly ? 'true' : 'false'}
        data-capture={capture && pickViewport ? 'page' : 'none'}
      >
        <button type="button" onClick={onClose}>
          Close feedback
        </button>
        <button type="button" onClick={() => onSent?.()}>
          Send it
        </button>
        {onHideButton && (
          <button type="button" onClick={onHideButton}>
            Hide button
          </button>
        )}
      </div>
    ) : null,
}));

const openChord = () => fireEvent.keyDown(window, { key: 'ƒ', code: 'KeyF', altKey: true });
const fab = () => screen.queryByRole('button', { name: 'Give feedback' });

describe('GlobalFeedback', () => {
  beforeEach(() => {
    mockPathname = '/members';
    mockPreferences = { memberPreferences: { showFeedbackButton: true } };
    mockPreferencesLoading = false;
    jest.clearAllMocks();
    act(() => useFeedbackDrawerStore.getState().actions.closeDrawer());
  });

  it('renders nothing for a signed-out visitor', () => {
    const { container } = render(<GlobalFeedback isLoggedIn={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the button on a page outside AI Apps, with its shortcut hint', () => {
    render(<GlobalFeedback isLoggedIn />);

    expect(fab()).toHaveAttribute('aria-keyshortcuts', 'Alt+F Control+Alt+Enter');
    expect(screen.getByText('Alt+F', { selector: 'kbd' })).toBeInTheDocument();
    expect(screen.queryByTestId('feedback-dialog')).not.toBeInTheDocument();
  });

  it('hides its button on AI Apps pages, which keep their own', () => {
    mockPathname = '/pl-infra/ai-apps/app-1';

    render(<GlobalFeedback isLoggedIn />);

    expect(fab()).not.toBeInTheDocument();
  });

  it('shows no button on a bare route, which has no site chrome', () => {
    mockPathname = '/explore-pl-network';

    render(<GlobalFeedback isLoggedIn />);

    expect(fab()).not.toBeInTheDocument();
  });

  it('opens the LabOS-only drawer with a picture of the page, sending feedback-button-click', () => {
    render(<GlobalFeedback isLoggedIn />);

    fireEvent.click(fab()!);

    expect(useFeedbackDrawerStore.getState().open).toBe(true);
    const dialog = screen.getByTestId('feedback-dialog');
    expect(dialog).toHaveAttribute('data-variant', 'drawer');
    expect(dialog).toHaveAttribute('data-labos-only', 'true');
    expect(dialog).toHaveAttribute('data-capture', 'page');
    expect(mockCapture).toHaveBeenCalledWith(
      'feedback-button-click',
      expect.objectContaining({ source: 'floating-button', page: '/members' }),
    );
    expect(mockCapture).not.toHaveBeenCalledWith('ai_apps_feedback_dialog_opened', expect.anything());

    fireEvent.click(screen.getByRole('button', { name: 'Close feedback' }));
    expect(useFeedbackDrawerStore.getState().open).toBe(false);
  });

  it('opens from Alt+F as the shortcut, and leaves ? to the page', () => {
    render(<GlobalFeedback isLoggedIn />);

    fireEvent.keyDown(window, { key: '?', shiftKey: true });
    expect(screen.queryByText('Keyboard shortcuts')).not.toBeInTheDocument();

    openChord();

    expect(useFeedbackDrawerStore.getState().open).toBe(true);
    expect(mockCapture).toHaveBeenCalledWith(
      'feedback-button-click',
      expect.objectContaining({ source: 'shortcut', page: '/members' }),
    );
  });

  it('without the button (AI Apps pages) leaves the shortcut alone but still draws the drawer', () => {
    mockPathname = '/pl-infra/ai-apps/app-1';
    render(<GlobalFeedback isLoggedIn />);

    openChord();
    expect(useFeedbackDrawerStore.getState().open).toBe(false);

    act(() => useFeedbackDrawerStore.getState().actions.openDrawer());
    expect(screen.getByTestId('feedback-dialog')).toHaveAttribute('data-labos-only', 'true');
  });

  it('opens when another door (the help menu) opens the drawer', () => {
    render(<GlobalFeedback isLoggedIn />);

    act(() => useFeedbackDrawerStore.getState().actions.openDrawer());

    expect(screen.getByTestId('feedback-dialog')).toBeInTheDocument();
  });

  it('sends feedback-submit with the page when feedback is sent', () => {
    mockPathname = '/teams/team-1';
    render(<GlobalFeedback isLoggedIn />);
    act(() => useFeedbackDrawerStore.getState().actions.openDrawer());

    fireEvent.click(screen.getByRole('button', { name: 'Send it' }));

    expect(mockCapture).toHaveBeenCalledWith('feedback-submit', expect.objectContaining({ page: '/teams/team-1' }));
  });

  it('shows no button while the preference loads, or when the member hid it, and keeps the drawer', () => {
    mockPreferencesLoading = true;
    const { rerender } = render(<GlobalFeedback isLoggedIn />);
    expect(fab()).not.toBeInTheDocument();

    mockPreferencesLoading = false;
    mockPreferences = { memberPreferences: { showFeedbackButton: false } };
    rerender(<GlobalFeedback isLoggedIn />);
    expect(fab()).not.toBeInTheDocument();

    act(() => useFeedbackDrawerStore.getState().actions.openDrawer());
    expect(screen.getByTestId('feedback-dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hide button' })).not.toBeInTheDocument();
  });

  it('hides the button for good: closes the drawer and saves the preference', () => {
    render(<GlobalFeedback isLoggedIn />);
    act(() => useFeedbackDrawerStore.getState().actions.openDrawer());

    fireEvent.click(screen.getByRole('button', { name: 'Hide button' }));

    expect(useFeedbackDrawerStore.getState().open).toBe(false);
    expect(mockSetShowFeedbackButton).toHaveBeenCalledWith(false);
  });

  it('steps the button aside while the drawer is open', () => {
    render(<GlobalFeedback isLoggedIn />);

    act(() => useFeedbackDrawerStore.getState().actions.openDrawer());

    expect(screen.getByRole('button', { name: 'Give feedback', hidden: true })).toHaveAttribute('tabindex', '-1');
  });
});
