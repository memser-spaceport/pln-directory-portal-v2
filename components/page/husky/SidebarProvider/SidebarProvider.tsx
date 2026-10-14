'use client';

import { useMemo, useState, useEffect, useCallback, ComponentProps, CSSProperties } from 'react';

import { useIsBelowTabletLandscape } from '@/hooks/useIsBelowTabletLandscape';

import type { ISidebarContext } from '../types/sidebarContext';

import { SidebarContext } from '../context/SidebarContext';

import s from './SidebarProvider.module.scss';

const SIDEBAR_COOKIE_NAME = 'sidebar:state';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = '300px';
const SIDEBAR_WIDTH_ICON = '64px';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

interface Props extends ComponentProps<'div'> {
  defaultOpen?: boolean;
}

export const SidebarProvider = (props: Props) => {
  const { defaultOpen = true, children, ...rest } = props;

  const isMobile = useIsBelowTabletLandscape();
  const [openMobile, setOpenMobile] = useState(false);
  const [open, setOpenState] = useState(defaultOpen);

  const setOpen = useCallback(
    (value: boolean | ((open: boolean) => boolean)) => {
      const openState = typeof value === 'function' ? value(open) : value;
      setOpenState(openState);
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [open],
  );

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((value) => !value);
    } else {
      setOpen((value) => !value);
    }
  }, [isMobile, setOpen]);

  useEffect(() => {
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

  const contextValue = useMemo<ISidebarContext>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        className={s.root}
        data-state={state}
        style={{ '--sidebar-width': SIDEBAR_WIDTH, '--sidebar-width-icon': SIDEBAR_WIDTH_ICON } as CSSProperties}
        {...rest}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
};
