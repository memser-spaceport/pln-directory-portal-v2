import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloatingFeedbackButton } from '@/components/page/ai-apps/components/FloatingFeedbackButton';

const mockUsePermissions = jest.fn();

jest.mock('@/services/rbac/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

jest.mock('@/components/page/ai-apps/components/GiveAiAppFeedbackDialog', () => ({
  GiveAiAppFeedbackDialog: ({
    isOpen,
    anchorRef,
    placement,
    appName,
    onSubmitted,
    onClose,
  }: {
    isOpen: boolean;
    anchorRef?: { current: HTMLElement | null };
    placement?: string;
    appName?: string;
    onSubmitted?: (app: { label: string; value: string }) => void;
    onClose?: () => void;
  }) =>
    isOpen ? (
      <div data-placement={placement} data-app-name={appName ?? ''}>
        {anchorRef?.current ? 'Feedback dialog open' : 'Feedback dialog unanchored'}
        <button type="button" onClick={() => onSubmitted?.({ label: 'Chosen App', value: 'chosen-app' })}>
          Complete submit
        </button>
        <button type="button" onClick={() => onClose?.()}>
          Close feedback
        </button>
      </div>
    ) : null,
}));

const withAccess = () => mockUsePermissions.mockReturnValue({ permsSet: new Set(['ai_apps.read']), isLoading: false });

describe('FloatingFeedbackButton', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing while permissions are loading', () => {
    mockUsePermissions.mockReturnValue({ permsSet: new Set(), isLoading: true });

    const { container } = render(<FloatingFeedbackButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for members without AI Apps access', () => {
    mockUsePermissions.mockReturnValue({ permsSet: new Set(), isLoading: false });

    const { container } = render(<FloatingFeedbackButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the trigger and opens the dialog on click for members with access', () => {
    mockUsePermissions.mockReturnValue({ permsSet: new Set(['ai_apps.read']), isLoading: false });

    render(<FloatingFeedbackButton />);

    const button = screen.getByRole('button', { name: 'Give feedback' });
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
  });

  it('renders a floating pill rather than an inline header trigger', () => {
    withAccess();

    render(<FloatingFeedbackButton />);
    const button = screen.getByRole('button', { name: 'Give feedback' });
    expect(button.className).toMatch(/button/);
    expect(button.className).not.toMatch(/headerButton/);
  });

  it('anchors the dialog to the trigger wrapper, opening above it', () => {
    withAccess();

    render(<FloatingFeedbackButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

    const dialog = screen.getByText('Feedback dialog open');
    expect(dialog).toBeInTheDocument();
    expect(screen.queryByText('Feedback dialog unanchored')).not.toBeInTheDocument();
    // The trigger sits in the bottom-right corner; measuring down from it would
    // put the panel below the fold.
    expect(dialog).toHaveAttribute('data-placement', 'above');
  });

  describe('the introduction', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    const wrapOf = (container: HTMLElement) => container.querySelector('[data-collapsed]');

    it('opens saying its name, then settles to the glyph', () => {
      withAccess();

      const { container } = render(<FloatingFeedbackButton />);
      expect(wrapOf(container)).toHaveAttribute('data-collapsed', 'false');
      expect(screen.getByText('Give feedback', { selector: 'span' })).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(2200);
      });

      expect(wrapOf(container)).toHaveAttribute('data-collapsed', 'true');
      // The label collapses by width; the accessible name never moves.
      expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
    });

    it('does not spend the introduction while permissions are still loading', () => {
      mockUsePermissions.mockReturnValue({ permsSet: new Set(), isLoading: true });

      const { container, rerender } = render(<FloatingFeedbackButton />);
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(container).toBeEmptyDOMElement();

      withAccess();
      rerender(<FloatingFeedbackButton />);

      // The label is spent on arrival, not on a window the member never saw.
      expect(wrapOf(container)).toHaveAttribute('data-collapsed', 'false');
    });

    it('replays when a different app is opened', () => {
      withAccess();

      const { container, rerender } = render(<FloatingFeedbackButton appUid="app-a" appName="App A" />);
      act(() => {
        jest.advanceTimersByTime(2200);
      });
      expect(wrapOf(container)).toHaveAttribute('data-collapsed', 'true');

      // Next reuses the [id] page across param changes, so this is a re-render,
      // not a remount — the introduction has to be keyed on the app.
      rerender(<FloatingFeedbackButton appUid="app-b" appName="App B" />);

      expect(wrapOf(container)).toHaveAttribute('data-collapsed', 'false');
    });

    it('does not collapse while the feedback dialog is open', () => {
      withAccess();

      const { container } = render(<FloatingFeedbackButton />);
      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(wrapOf(container)).toHaveAttribute('data-collapsed', 'false');
    });
  });

  describe('keyboard shortcuts', () => {
    const openChord = () => fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true, altKey: true });

    it('opens from the shortcut, and shows it on the trigger', () => {
      withAccess();

      render(<FloatingFeedbackButton />);

      expect(screen.getByRole('button', { name: 'Give feedback' })).toHaveAttribute(
        'aria-keyshortcuts',
        expect.stringMatching(/Enter/),
      );
      openChord();

      expect(screen.getByText('Feedback dialog open')).toHaveAttribute('data-app-name', '');
    });

    it('reopens the submitted app once, then returns to the picker', () => {
      withAccess();

      render(<FloatingFeedbackButton />);
      openChord();
      fireEvent.click(screen.getByRole('button', { name: 'Complete submit' }));
      fireEvent.click(screen.getByRole('button', { name: 'Close feedback' }));

      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
      expect(screen.getByText('Feedback dialog open')).toHaveAttribute('data-app-name', '');
      fireEvent.click(screen.getByRole('button', { name: 'Close feedback' }));

      openChord();
      expect(screen.getByText('Feedback dialog open')).toHaveAttribute('data-app-name', 'Chosen App');
      fireEvent.click(screen.getByRole('button', { name: 'Close feedback' }));

      openChord();
      expect(screen.getByText('Feedback dialog open')).toHaveAttribute('data-app-name', '');
    });

    it('opens a detail page on that page’s app', () => {
      withAccess();

      render(<FloatingFeedbackButton appUid="app-a" appName="App A" />);
      openChord();

      expect(screen.getByText('Feedback dialog open')).toHaveAttribute('data-app-name', 'App A');
    });
  });
});
