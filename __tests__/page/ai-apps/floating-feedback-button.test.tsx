import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloatingFeedbackButton } from '@/components/page/ai-apps/components/FloatingFeedbackButton';

const mockUsePermissions = jest.fn();
/* The form's close guard. By default nothing is unsent, so the host's close runs at once. */
const mockRequestClose = jest.fn((close: () => void) => close());

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
    headerTabs,
    capture,
    ref,
  }: {
    ref?: React.Ref<{ requestClose: (close: () => void) => void }>;
    capture?: () => Promise<unknown>;
    headerTabs?: React.ReactNode;
    isOpen: boolean;
    anchorRef?: { current: HTMLElement | null };
    placement?: string;
    appName?: string;
    onSubmitted?: (app: { label: string; value: string }) => void;
    onClose?: () => void;
  }) => {
    require('react').useImperativeHandle(ref, () => ({ requestClose: mockRequestClose }));
    return isOpen ? (
      <div data-placement={placement} data-app-name={appName ?? ''} data-capture={capture ? 'bridge' : 'none'}>
        {headerTabs}
        {anchorRef?.current ? 'Feedback dialog open' : 'Feedback dialog unanchored'}
        <button type="button" onClick={() => onSubmitted?.({ label: 'Chosen App', value: 'chosen-app' })}>
          Complete submit
        </button>
        <button type="button" onClick={() => onClose?.()}>
          Close feedback
        </button>
      </div>
    ) : null;
  },
}));

const withAccess = () => mockUsePermissions.mockReturnValue({ permsSet: new Set(['ai_apps.read']), isLoading: false });

describe('FloatingFeedbackButton', () => {
  beforeEach(() => {
    mockRequestClose.mockImplementation((close: () => void) => close());
  });

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

    it('hides the button and ignores the shortcut when feedback is off', () => {
      withAccess();

      const { container } = render(<FloatingFeedbackButton appUid="app-a" appName="App A" feedbackEnabled={false} />);

      expect(container).toBeEmptyDOMElement();
      openChord();
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it('still shows Give feedback when the setting is on or omitted', () => {
      withAccess();

      const { rerender } = render(<FloatingFeedbackButton appUid="app-a" feedbackEnabled />);
      expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();

      rerender(<FloatingFeedbackButton appUid="app-a" />);
      expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
    });
  });

  describe('element pins (bridge-enabled apps)', () => {
    const controller = (status: 'ready' | 'unavailable' | 'waiting', pins: unknown[] = []) =>
      ({
        status,
        isPicking: false,
        pins,
        onFrameLoad: jest.fn(),
        startPicking: jest.fn(),
        stopPicking: jest.fn(),
        setNote: jest.fn(),
        removePin: jest.fn(),
        clearPins: jest.fn(),
      }) as any;
    const iframeRef = { current: null };

    it('opens pin mode and starts picking when the app answered — no dialog', () => {
      withAccess();
      const pins = controller('ready');
      render(<FloatingFeedbackButton appUid="app-1" appName="My App" elementPins={pins} iframeRef={iframeRef} />);

      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      expect(screen.getByRole('complementary', { name: 'Pin feedback' })).toBeInTheDocument();
      expect(pins.startPicking).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it("hands the bridge's capture to the form when the app's bridge can capture", () => {
      withAccess();
      const pins = { ...controller('unavailable'), canCapture: true, capture: jest.fn() };
      render(<FloatingFeedbackButton appUid="app-1" appName="My App" elementPins={pins} iframeRef={iframeRef} />);

      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      expect(screen.getByText('Feedback dialog open').closest('[data-capture]')).toHaveAttribute(
        'data-capture',
        'bridge',
      );
    });

    it.each(['unavailable', 'waiting'] as const)('keeps the screenshot dialog when the bridge is %s', (status) => {
      withAccess();
      const pins = controller(status);
      render(<FloatingFeedbackButton appUid="app-1" appName="My App" elementPins={pins} iframeRef={iframeRef} />);

      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(screen.queryByRole('complementary', { name: 'Pin feedback' })).not.toBeInTheDocument();
      expect(pins.startPicking).not.toHaveBeenCalled();
    });

    it('Continue hands over to the dialog; closing the dialog ends the pin session', () => {
      withAccess();
      const pin = {
        id: 'pin-1',
        note: 'Too small',
        rect: { x: 0, y: 0, w: 1, h: 1 },
        crop: { status: 'pending' },
        element: { selector: '#a', tag: 'button', text: '', component: null, page: { path: '/' } },
      };
      const pins = controller('ready', [pin]);
      render(<FloatingFeedbackButton appUid="app-1" appName="My App" elementPins={pins} iframeRef={iframeRef} />);

      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

      expect(pins.stopPicking).toHaveBeenCalled();
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(screen.queryByRole('complementary', { name: 'Pin feedback' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Close feedback' }));
      expect(pins.clearPins).toHaveBeenCalled();
    });
  });

  describe('feedback & comments (one panel, two tabs)', () => {
    const openChord = () => fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true, altKey: true });
    const comments = (overrides: Partial<{ active: boolean; count: number; feedbackRequest: number }> = {}) => ({
      available: true,
      active: false,
      count: 0,
      onOpen: jest.fn(),
      onClose: jest.fn(),
      feedbackRequest: 0,
      ...overrides,
    });

    it('is named Feedback & comments and opens on the Feedback tab', () => {
      withAccess();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments({ count: 3 })} />);

      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));

      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Feedback' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /Comment/ })).toHaveTextContent('3');
      /* Feedback is the primary door: left of Comment (prototype ai-apps-comments). */
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Feedback', 'Comment3']);
    });

    it('the Comment tab closes the form and turns comment mode on', () => {
      withAccess();
      const commentMode = comments();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={commentMode} />);
      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));

      fireEvent.click(screen.getByRole('tab', { name: /Comment/ }));

      expect(commentMode.onOpen).toHaveBeenCalled();
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it('with unsent work in the form, the Comment tab and the button wait for it to agree', () => {
      withAccess();
      const commentMode = comments();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={commentMode} />);
      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));
      /* The form asks "Discard your feedback?" and the member keeps editing. */
      mockRequestClose.mockImplementation(() => undefined);

      fireEvent.click(screen.getByRole('tab', { name: /Comment/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Close feedback and comments' }));

      expect(mockRequestClose).toHaveBeenCalledTimes(2);
      expect(commentMode.onOpen).not.toHaveBeenCalled();
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();

      /* …then discards: the tab's own close runs. */
      const [closeFromTab] = mockRequestClose.mock.calls[0];
      act(() => closeFromTab());
      expect(commentMode.onOpen).toHaveBeenCalled();
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it('pressed again it closes whichever tab is open', () => {
      withAccess();
      const { rerender } = render(
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));
      fireEvent.click(screen.getByRole('button', { name: 'Close feedback and comments' }));
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();

      const inMode = comments({ active: true });
      rerender(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={inMode} />);
      fireEvent.click(screen.getByRole('button', { name: 'Close feedback and comments' }));
      expect(inMode.onClose).toHaveBeenCalled();
    });

    it('the shortcut leaves comment mode', () => {
      withAccess();
      const inMode = comments({ active: true });
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={inMode} />);
      openChord();
      expect(inMode.onClose).toHaveBeenCalled();
    });

    it('opens the form when the page asks (the comment card’s Feedback tab)', () => {
      withAccess();
      const { rerender } = render(
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments()} />,
      );
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
      rerender(
        <FloatingFeedbackButton
          appUid="app-1"
          appName="Grant Tracker"
          commentMode={comments({ feedbackRequest: 1 })}
        />,
      );
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
    });

    it('carries the comment count while the panel is closed', () => {
      withAccess();
      const { rerender } = render(
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments({ count: 3 })} />,
      );
      expect(screen.getByLabelText('3 comments')).toHaveTextContent('3');
      rerender(
        <FloatingFeedbackButton
          appUid="app-1"
          appName="Grant Tracker"
          commentMode={comments({ count: 3, active: true })}
        />,
      );
      expect(screen.queryByLabelText(/\d+ comments/)).not.toBeInTheDocument();
    });

    it('without comments it stays "Give feedback", with no tabs', () => {
      withAccess();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" />);
      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
  });
});
