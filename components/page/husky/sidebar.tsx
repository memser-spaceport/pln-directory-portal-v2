'use client';

import { useIsMobile } from '@/hooks/useIsMobile';
import React from 'react';

const SIDEBAR_COOKIE_NAME = 'sidebar:state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '300px';
const SIDEBAR_WIDTH_MOBILE = '246px';
const SIDEBAR_WIDTH_ICON = '64px';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

type SidebarContext = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

const useSidebar = () => {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }

  return context;
};

const Sidebar = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'> & {}>(({ className, children, ...props }, ref) => {
  const { isMobile, state, openMobile } = useSidebar();

  if (isMobile && openMobile) {
    return (
      <div className="sidebar-mobile-backdrop">
        <div
          data-sidebar="sidebar"
          data-mobile="true"
          className="sidebar sidebar--mobile"
          style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
          data-state={openMobile ? 'expanded' : 'collapsed'}
        >
          <div className="sidebar__content">{children}</div>
        </div>

        <style jsx>{`
          .sidebar--mobile {
            width: var(--sidebar-width);
            background-color: #ffffff;
            padding: 0;
            color: var(--sidebar-foreground, #333);
            height: calc(100svh - 82px);
            transform: translateX(-100%);
          }

          .sidebar-mobile-backdrop {
            position: fixed;
            right: 0;
            z-index: 3;
            top: 0;
            background-color: rgb(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            top: 80px;
          }

          .sidebar__content {
            height: 100%;
            display: flex;
            flex-direction: column;
          }

          @keyframes slideIn {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }

          @keyframes slideOut {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-100%);
            }
          }

          .sidebar--mobile[data-state='expanded'] {
            animation: slideIn 0.3s ease-in-out forwards;
          }

          .sidebar--mobile[data-state='collapsed'] {
            animation: slideOut 0.3s ease-in-out forwards;
          }
        `}</style>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div ref={ref} className={`hidden block sidebar-wrapper`} data-state={state} {...props}>
        <div className="sidebar-gap"></div>
        <div className="sidebar-content">
          <div className="sidebar">{children}</div>
        </div>

        <style jsx>{`
          .hidden {
            display: none;
          }

          .sidebar-gap {
            height: 100%;
            width: var(--sidebar-width);
            transition: width 0.2s linear;
            animation-timing-function: linear;
            animation-duration: 0.2s;
            transition-timing-function: linear;
            transition-duration: 0.2s;
            position: relative;
          }

          .sidebar-content {
            position: fixed;
            bottom: 0;
            z-index: 10;
            height: calc(100vh - 82px);
            width: var(--sidebar-width, 250px);
            transition: left 0.2s ease-in-out, right 0.2s ease-in-out, width 0.2s linear;
            display: flex;
          }

          .sidebar {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background-color: #ffffff;
            color: var(--sidebar-foreground, #333);
            transition: width 0.3s ease;
          }

          .sidebar-wrapper {
            box-shadow: 1px 0px 4px 0px #0000002e;
          }

          .sidebar-wrapper[data-state='collapsed'] .sidebar-gap {
            width: var(--sidebar-width-icon);
          }

          .sidebar-wrapper[data-state='collapsed'] .sidebar-content {
            width: var(--sidebar-width-icon);
          }

          @media (min-width: 768px) {
            .block {
              display: block;
            }

            .flex {
              display: flex;
            }
          }
        `}</style>
      </div>
    );
  }

  return null;
});
Sidebar.displayName = 'Sidebar';

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);

  // Internal controlled state
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open]
  );

  // Toggle sidebar
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Keyboard shortcut for toggling
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? 'expanded' : 'collapsed';

  const contextValue = React.useMemo<SidebarContext>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={`sidebar-provider`}
        ref={ref}
        data-state={state}
        style={
          {
            '--sidebar-width': SIDEBAR_WIDTH,
            '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>

      <style jsx>{`
        .sidebar-provider {
          display: flex;
          min-height: inherit;
          width: 100%;
          background-color: #ffffff;
          transition: width 0.3s ease;
        }
      `}</style>
    </SidebarContext.Provider>
  );
});
SidebarProvider.displayName = 'SidebarProvider';

export { Sidebar, SidebarProvider, useSidebar };
