import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { FloatingFeedbackButton } from '@/components/page/ai-apps/components/FloatingFeedbackButton';

const mockUsePermissions = jest.fn();
let mockShowComments = false;

jest.mock('@/services/ai-apps/constants', () => ({
  ...jest.requireActual('@/services/ai-apps/constants'),
  get SHOW_AI_APPS_COMMENTS() {
    return mockShowComments;
  },
}));
/* The form's close guard. By default nothing is unsent, so the host's close runs at once. */

jest.mock('@/services/rbac/hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions(),
}));

const mockCapture = jest.fn();
jest.mock('posthog-js/react', () => ({
  usePostHog: () => ({ capture: (...args: unknown[]) => mockCapture(...args) }),
}));

jest.mock('@/components/page/ai-apps/components/GiveAiAppFeedbackDialog', () => ({
  GiveAiAppFeedbackDialog: ({
    isOpen,
    variant,
    appName,
    onClose,
    switchSlot,
    altBody,
    capture,
    bridgeMissing,
    onHiddenChange,
    pickViewport,
    scrollApp,
  }: {
    onHiddenChange?: (hidden: boolean) => void;
    bridgeMissing?: boolean;
    capture?: () => Promise<unknown>;
    pickViewport?: boolean;
    scrollApp?: (x: number, y: number, dx: number, dy: number) => void;
    switchSlot?: React.ReactNode;
    altBody?: React.ReactNode;
    isOpen: boolean;
    variant?: string;
    appName?: string;
    onClose?: () => void;
  }) => {
    return isOpen ? (
      <div
        data-testid="feedback-dialog"
        data-variant={variant ?? 'popover'}
        data-app-name={appName ?? ''}
        data-capture={capture ? (pickViewport ? 'page' : 'bridge') : 'none'}
        data-pick-viewport={pickViewport ? 'true' : 'false'}
        data-scroll={scrollApp ? 'yes' : 'no'}
        data-bridge-missing={bridgeMissing ? 'true' : 'false'}
      >
        {switchSlot}
        {altBody ?? <span>Feedback form</span>}
        <span>Feedback dialog open</span>
        <button type="button" onClick={() => onClose?.()}>
          Close feedback
        </button>
        <button type="button" onClick={() => onHiddenChange?.(true)}>
          Start capture
        </button>
        <button type="button" onClick={() => onHiddenChange?.(false)}>
          End capture
        </button>
      </div>
    ) : null;
  },
  ShortcutHelp: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog">Keyboard shortcuts</div> : null),
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

  it('on the list, opens instant screenshots over the page and does not offer comments', () => {
    withAccess();

    render(<FloatingFeedbackButton />);
    expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Feedback & comments' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

    const dialog = screen.getByTestId('feedback-dialog');
    expect(dialog).toHaveAttribute('data-capture', 'page');
    expect(dialog).toHaveAttribute('data-pick-viewport', 'true');
    expect(dialog).toHaveAttribute('data-scroll', 'yes');
    expect(screen.queryByRole('tab', { name: /comment/i })).not.toBeInTheDocument();
  });

  it('an app page without a capturing bridge does not use the list capture', () => {
    withAccess();

    render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" />);
    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

    const dialog = screen.getByTestId('feedback-dialog');
    expect(dialog).toHaveAttribute('data-capture', 'none');
    expect(dialog).toHaveAttribute('data-pick-viewport', 'false');
    expect(dialog).toHaveAttribute('data-scroll', 'no');
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

  /* LAB-2767: the button opens a drawer on the right, not a popover above it, and steps aside while it is open. */
  it('opens the feedback drawer and hides the button while the drawer is open', () => {
    withAccess();

    const { container } = render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" />);
    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

    expect(screen.getByTestId('feedback-dialog')).toHaveAttribute('data-variant', 'drawer');
    const wrap = container.querySelector('[data-collapsed]');
    expect(wrap?.className).toMatch(/fabHidden/);
    expect(wrap).toHaveAttribute('aria-hidden', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Close feedback' }));
    expect(screen.queryByTestId('feedback-dialog')).not.toBeInTheDocument();
    expect(wrap?.className).not.toMatch(/fabHidden/);
  });

  /* LAB-2759: a screen share of the tab must show only the app, so the button
     leaves the picture whenever the form hides itself for a capture. */
  it('hides the floating button while the form is hidden for a capture, and brings it back after', () => {
    withAccess();

    const { container } = render(<FloatingFeedbackButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
    const wrap = container.querySelector('[data-collapsed]');
    expect(wrap?.className).not.toMatch(/wrapHidden/);

    fireEvent.click(screen.getByRole('button', { name: 'Start capture' }));
    expect(wrap?.className).toMatch(/wrapHidden/);

    fireEvent.click(screen.getByRole('button', { name: 'End capture' }));
    expect(wrap?.className).not.toMatch(/wrapHidden/);
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

    /* LAB-2767: the drawer is not anchored to the button, which steps aside while it is open. */
    it('settles to the glyph and steps aside while the feedback drawer is open', () => {
      withAccess();

      const { container } = render(<FloatingFeedbackButton />);
      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(wrapOf(container)).toHaveAttribute('data-collapsed', 'true');
      expect(wrapOf(container)?.className).toMatch(/fabHidden/);
    });
  });

  describe('keyboard shortcuts', () => {
    /* Option+F on a Mac reports key "ƒ"; the physical key is what counts. */
    const openChord = (init: Partial<KeyboardEventInit> = {}, target: Window | Element = window) =>
      fireEvent.keyDown(target, { key: 'ƒ', code: 'KeyF', altKey: true, ...init });

    it('opens from Alt+F, and shows it on the trigger', () => {
      withAccess();

      render(<FloatingFeedbackButton />);

      expect(screen.getByRole('button', { name: 'Give feedback' })).toHaveAttribute(
        'aria-keyshortcuts',
        'Alt+F Control+Alt+Enter',
      );
      expect(screen.getByText('Alt+F', { selector: 'kbd' })).toBeInTheDocument();
      expect(screen.queryByText('Ctrl+Alt+Enter')).not.toBeInTheDocument();
      openChord();

      expect(screen.getByTestId('feedback-dialog')).toHaveAttribute('data-app-name', '');
    });

    it('opens from Ctrl+Alt+Enter too, even while typing in a field', () => {
      withAccess();

      render(
        <>
          <input aria-label="Search" />
          <FloatingFeedbackButton />
        </>,
      );
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search' }), { key: 'Enter', ctrlKey: true, altKey: true });

      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
    });

    it('ignores Ctrl+Alt+Enter while another dialog is open', () => {
      withAccess();

      render(
        <>
          <div role="dialog" aria-label="Edit app" />
          <FloatingFeedbackButton />
        </>,
      );
      fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true, altKey: true });

      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it.each([
      ['with Ctrl', { ctrlKey: true }],
      ['with Shift', { shiftKey: true }],
      ['during IME composition', { isComposing: true }],
      ['on key repeat', { repeat: true }],
    ])('ignores Alt+F %s', (_, init) => {
      withAccess();

      render(<FloatingFeedbackButton />);
      openChord(init);

      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it('ignores Alt+F while typing in a field', () => {
      withAccess();

      render(
        <>
          <input aria-label="Search" />
          <FloatingFeedbackButton />
        </>,
      );
      openChord({}, screen.getByRole('textbox', { name: 'Search' }));

      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it('ignores Alt+F while another dialog is open', () => {
      withAccess();

      render(
        <>
          <div role="dialog" aria-label="Edit app" />
          <FloatingFeedbackButton />
        </>,
      );
      openChord();

      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it('opens the keyboard shortcuts on ?, outside text fields', () => {
      withAccess();

      render(
        <>
          <input aria-label="Search" />
          <FloatingFeedbackButton />
        </>,
      );
      fireEvent.keyDown(screen.getByRole('textbox', { name: 'Search' }), { key: '?', shiftKey: true });
      expect(screen.queryByText('Keyboard shortcuts')).not.toBeInTheDocument();

      fireEvent.keyDown(window, { key: '?', shiftKey: true });

      expect(screen.getByText('Keyboard shortcuts')).toBeInTheDocument();
      openChord();
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it('opens a detail page on that page’s app', () => {
      withAccess();

      render(<FloatingFeedbackButton appUid="app-a" appName="App A" />);
      openChord();

      expect(screen.getByTestId('feedback-dialog')).toHaveAttribute('data-app-name', 'App A');
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

    afterEach(() => {
      mockShowComments = false;
    });

    it('opens the form, not pin mode, while comments are off', () => {
      withAccess();
      const pins = { ...controller('ready'), canCapture: true, capture: jest.fn() };
      render(<FloatingFeedbackButton appUid="app-1" appName="My App" elementPins={pins} iframeRef={iframeRef} />);

      expect(screen.getByRole('button', { name: 'Give feedback' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      expect(screen.getByText('Feedback dialog open').closest('[data-capture]')).toHaveAttribute(
        'data-capture',
        'bridge',
      );
      expect(screen.queryByRole('complementary', { name: 'Pin feedback' })).not.toBeInTheDocument();
      expect(pins.startPicking).not.toHaveBeenCalled();
    });

    it.each([
      ['unavailable', 'true'],
      ['ready', 'false'],
      ['waiting', 'false'],
    ] as const)('tells the form the bridge is missing only when it never answered (%s)', (status, missing) => {
      withAccess();
      render(
        <FloatingFeedbackButton
          appUid="app-1"
          appName="My App"
          elementPins={controller(status)}
          iframeRef={iframeRef}
        />,
      );

      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      expect(screen.getByText('Feedback dialog open').closest('[data-bridge-missing]')).toHaveAttribute(
        'data-bridge-missing',
        missing,
      );
    });

    it('opens pin mode and starts picking when the app answered — no dialog', () => {
      mockShowComments = true;
      withAccess();
      const pins = controller('ready');
      render(<FloatingFeedbackButton appUid="app-1" appName="My App" elementPins={pins} iframeRef={iframeRef} />);

      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      expect(screen.getByRole('complementary', { name: 'Pin feedback' })).toBeInTheDocument();
      expect(pins.startPicking).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    /* LAB-2759: the pin markers sit over the app, so a screen share would grab them too. */
    it('takes the pin markers out of the picture while the form is hidden for a capture', () => {
      withAccess();
      const pin = { id: 'pin-1', note: '', rect: { x: 10, y: 10, w: 40, h: 20 } };
      const frameRef = { current: document.createElement('iframe') };
      render(
        <FloatingFeedbackButton
          appUid="app-1"
          appName="My App"
          elementPins={controller('ready', [pin])}
          iframeRef={frameRef}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
      expect(screen.getByRole('button', { name: 'Pin 1' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Start capture' }));
      expect(screen.queryByRole('button', { name: 'Pin 1' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'End capture' }));
      expect(screen.getByRole('button', { name: 'Pin 1' })).toBeInTheDocument();
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

    it('Alt+F opens pin mode too, as the button does', () => {
      mockShowComments = true;
      withAccess();
      const pins = controller('ready');
      render(<FloatingFeedbackButton appUid="app-1" appName="My App" elementPins={pins} iframeRef={iframeRef} />);

      fireEvent.keyDown(window, { key: 'ƒ', code: 'KeyF', altKey: true });

      expect(screen.getByRole('complementary', { name: 'Pin feedback' })).toBeInTheDocument();
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    it('Continue hands over to the dialog; closing the dialog ends the pin session', () => {
      mockShowComments = true;
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

  describe('feedback & comments (one drawer, a switcher under its title)', () => {
    const openChord = () => fireEvent.keyDown(window, { key: 'ƒ', code: 'KeyF', altKey: true });
    const comments = (overrides: Partial<{ active: boolean; count: number; closeRequest: number }> = {}) => ({
      available: true,
      active: false,
      count: 0,
      onOpen: jest.fn(),
      onClose: jest.fn(),
      body: <div>Comments list</div>,
      closeRequest: 0,
      ...overrides,
    });

    it('is named Feedback & comments and opens on Feedback: Feedback left and selected, Comments right with its count', () => {
      withAccess();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments({ count: 3 })} />);

      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));

      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(screen.getByText('Feedback form')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Feedback' })).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByRole('tab', { name: /Comments/ })).toHaveAttribute('aria-selected', 'false');
      expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Feedback', 'Comments3']);
    });

    it('shows no count beside Comments when there are none', () => {
      withAccess();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));
      expect(screen.getByRole('tab', { name: /Comments/ })).toHaveTextContent(/^Comments$/);
    });

    it('choosing Comments turns comment mode on, keeps the drawer open and tracks the click', () => {
      withAccess();
      const frameRef = { current: document.createElement('iframe') };
      const commentMode = comments();
      const { rerender } = render(
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={commentMode} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));

      fireEvent.click(screen.getByRole('tab', { name: /Comments/ }));

      expect(commentMode.onOpen).toHaveBeenCalled();
      expect(mockCapture).toHaveBeenCalledWith('ai-apps-feedback-comments-tab-clicked', { appUid: 'app-1' });
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();

      /* The page turns the mode on: the drawer body is the list, the switcher stays. */
      rerender(
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments({ active: true })} />,
      );
      expect(screen.getByText('Comments list')).toBeInTheDocument();
      expect(screen.queryByText('Feedback form')).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Comments/ })).toHaveAttribute('aria-selected', 'true');
    });

    it('choosing Feedback from Comments leaves comment mode and shows the form in the same drawer', () => {
      withAccess();
      const inMode = comments({ active: true });
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={inMode} />);
      expect(screen.getByText('Comments list')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: 'Feedback' }));

      expect(inMode.onClose).toHaveBeenCalled();
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
    });

    /* Comment mode draws its own pins; the old pin flow's overlay would stack a second set over them. */
    it('draws no pin-flow overlay over comment mode', () => {
      withAccess();
      const pins = {
        status: 'ready',
        isPicking: true,
        pins: [{ id: 'pin-1', note: '', rect: { x: 10, y: 10, w: 40, h: 20 } }],
        onFrameLoad: jest.fn(),
        startPicking: jest.fn(),
        stopPicking: jest.fn(),
        setNote: jest.fn(),
        removePin: jest.fn(),
        clearPins: jest.fn(),
      } as any;
      const frameRef = { current: document.createElement('iframe') };
      const commentMode = comments();
      const { rerender } = render(
        <FloatingFeedbackButton
          appUid="app-1"
          appName="Grant Tracker"
          elementPins={pins}
          iframeRef={frameRef}
          commentMode={commentMode}
        />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));
      fireEvent.click(screen.getByRole('tab', { name: /Comments/ }));
      rerender(
        <FloatingFeedbackButton
          appUid="app-1"
          appName="Grant Tracker"
          elementPins={pins}
          iframeRef={frameRef}
          commentMode={comments({ active: true })}
        />,
      );

      expect(screen.getByText('Comments list')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Pin 1' })).not.toBeInTheDocument();
    });

    it('closing the drawer on the Comments tab leaves comment mode too', () => {
      withAccess();
      const inMode = comments({ active: true });
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={inMode} />);

      fireEvent.click(screen.getByRole('button', { name: 'Close feedback' }));

      expect(inMode.onClose).toHaveBeenCalled();
    });

    it('closes the drawer when the page asks (Esc in comment mode with nothing left open)', () => {
      withAccess();
      const { rerender } = render(
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments()} />,
      );
      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();

      rerender(
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments({ closeRequest: 1 })} />,
      );
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    /* After one Esc the request is 1: comments dropping out (and back) must not read as a new request. */
    it('keeps the drawer open when comments drop out and come back after an earlier close request', () => {
      withAccess();
      const fab = (commentMode?: ReturnType<typeof comments>) => (
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={commentMode} />
      );
      const { rerender } = render(fab(comments({ closeRequest: 1 })));
      fireEvent.click(screen.getByRole('button', { name: 'Feedback & comments' }));
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();

      rerender(fab(undefined));
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();

      rerender(fab(comments({ closeRequest: 1 })));
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();

      /* A real bump still closes it. */
      rerender(fab(comments({ closeRequest: 2 })));
      expect(screen.queryByText('Feedback dialog open')).not.toBeInTheDocument();
    });

    /* Mounted with comments off and turned on later with a non-zero request: adopted, not obeyed. */
    it('does not close on the first close request it sees after comments arrive', () => {
      withAccess();
      const { rerender } = render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" />);
      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));

      rerender(
        <FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments({ closeRequest: 3 })} />,
      );
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
    });

    it('the shortcut opens the drawer on Feedback', () => {
      withAccess();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments()} />);
      openChord();
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Feedback' })).toHaveAttribute('aria-selected', 'true');
    });

    it('carries the comment count while the drawer is closed', () => {
      withAccess();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" commentMode={comments({ count: 3 })} />);
      expect(screen.getByLabelText('3 comments')).toHaveTextContent('3');
    });

    it('without comments it stays "Give feedback": the drawer has the form and no switcher', () => {
      withAccess();
      render(<FloatingFeedbackButton appUid="app-1" appName="Grant Tracker" />);
      fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
      expect(screen.getByText('Feedback dialog open')).toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });
  });
});
