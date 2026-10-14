import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

let mockIsMobile = false;

jest.mock('@/hooks/useIsBelowTabletLandscape', () => ({
  useIsBelowTabletLandscape: () => mockIsMobile,
}));

import { useSidebar } from '@/components/page/husky/hooks/useSidebar';
import { Sidebar } from '@/components/page/husky/Sidebar';
import { SidebarProvider } from '@/components/page/husky/SidebarProvider';

const SidebarControls = () => {
  const { state, open, openMobile, isMobile, toggleSidebar, setOpen, setOpenMobile } = useSidebar();
  return (
    <div>
      <span data-testid="state">{state}</span>
      <span data-testid="open">{String(open)}</span>
      <span data-testid="open-mobile">{String(openMobile)}</span>
      <span data-testid="is-mobile">{String(isMobile)}</span>
      <button onClick={toggleSidebar}>toggle</button>
      <button onClick={() => setOpen(false)}>collapse</button>
      <button onClick={() => setOpenMobile(false)}>close drawer</button>
    </div>
  );
};

const renderSidebar = (props: React.ComponentProps<typeof SidebarProvider> = {}) =>
  render(
    <SidebarProvider data-testid="provider" {...props}>
      <SidebarControls />
      <Sidebar data-testid="rail">
        <span>Rail content</span>
      </Sidebar>
    </SidebarProvider>,
  );

const clearSidebarCookie = () => {
  document.cookie = 'sidebar:state=; path=/; max-age=0';
};

beforeEach(() => {
  mockIsMobile = false;
  clearSidebarCookie();
});

describe('AI Search sidebar on desktop', () => {
  it('starts expanded and marks both the provider and the rail with data-state', () => {
    renderSidebar();

    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
    expect(screen.getByTestId('provider')).toHaveAttribute('data-state', 'expanded');
    expect(screen.getByTestId('rail')).toHaveAttribute('data-state', 'expanded');
    expect(screen.getByText('Rail content')).toBeInTheDocument();
  });

  it('starts collapsed with defaultOpen false and still renders its content', () => {
    renderSidebar({ defaultOpen: false });

    expect(screen.getByTestId('provider')).toHaveAttribute('data-state', 'collapsed');
    expect(screen.getByTestId('rail')).toHaveAttribute('data-state', 'collapsed');
    expect(screen.getByText('Rail content')).toBeInTheDocument();
  });

  it('exposes the rail widths as CSS variables on the provider', () => {
    renderSidebar();

    const style = screen.getByTestId('provider').style;
    expect(style.getPropertyValue('--sidebar-width')).toBe('300px');
    expect(style.getPropertyValue('--sidebar-width-icon')).toBe('64px');
  });

  it('collapses and expands on toggle and remembers the choice in the sidebar:state cookie', () => {
    renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('rail')).toHaveAttribute('data-state', 'collapsed');
    expect(document.cookie).toContain('sidebar:state=false');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.getByTestId('rail')).toHaveAttribute('data-state', 'expanded');
    expect(document.cookie).toContain('sidebar:state=true');
  });

  it('toggles with Ctrl+B as well as ⌘B, and ignores B without a modifier', () => {
    renderSidebar();

    fireEvent.keyDown(window, { key: 'b' });
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');

    fireEvent.keyDown(window, { key: 'b', ctrlKey: true });
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed');

    fireEvent.keyDown(window, { key: 'b', metaKey: true });
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');

    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
  });

  it('stops listening for the shortcut once unmounted', () => {
    const { unmount } = renderSidebar();
    unmount();

    expect(() => fireEvent.keyDown(window, { key: 'b', metaKey: true })).not.toThrow();
    expect(document.cookie).not.toContain('sidebar:state');
  });
});

describe('AI Search sidebar below 960px', () => {
  beforeEach(() => {
    mockIsMobile = true;
  });

  it('renders no rail until the drawer is opened', () => {
    renderSidebar();

    expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
    expect(screen.queryByText('Rail content')).not.toBeInTheDocument();
  });

  it('opens and closes the drawer on toggle without touching the desktop state or the cookie', () => {
    const { container } = renderSidebar();

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));

    const drawer = container.querySelector('[data-mobile="true"]');
    expect(drawer).toHaveAttribute('data-sidebar', 'sidebar');
    expect(drawer).toHaveAttribute('data-state', 'expanded');
    expect(drawer).toContainElement(screen.getByText('Rail content'));
    expect(screen.getByTestId('open-mobile')).toHaveTextContent('true');
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
    expect(document.cookie).not.toContain('sidebar:state');

    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));
    expect(screen.queryByText('Rail content')).not.toBeInTheDocument();
  });

  it('opens the drawer with ⌘B', () => {
    renderSidebar();

    act(() => {
      fireEvent.keyDown(window, { key: 'b', metaKey: true });
    });

    expect(screen.getByText('Rail content')).toBeInTheDocument();
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
  });

  it('closes the drawer through setOpenMobile', () => {
    renderSidebar();
    fireEvent.click(screen.getByRole('button', { name: 'toggle' }));

    fireEvent.click(screen.getByRole('button', { name: 'close drawer' }));

    expect(screen.queryByText('Rail content')).not.toBeInTheDocument();
  });
});

describe('useSidebar', () => {
  it('throws outside a SidebarProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Orphan = () => {
      useSidebar();
      return null;
    };

    expect(() => render(<Orphan />)).toThrow('useSidebar must be used within a SidebarProvider.');
    consoleError.mockRestore();
  });
});
