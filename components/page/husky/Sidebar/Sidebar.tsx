'use client';

import { ComponentProps, CSSProperties } from 'react';

import { useSidebar } from '../hooks/useSidebar';

import s from './Sidebar.module.scss';

const SIDEBAR_WIDTH_MOBILE = '320px';

export const Sidebar = (props: ComponentProps<'div'>) => {
  const { children, ...rest } = props;

  const { isMobile, state, openMobile } = useSidebar();

  if (isMobile && !openMobile) {
    return null;
  }

  if (isMobile) {
    return (
      <div className={s.mobileBackdrop}>
        <div
          data-sidebar="sidebar"
          data-mobile="true"
          className={s.mobile}
          style={{ '--sidebar-width': SIDEBAR_WIDTH_MOBILE } as CSSProperties}
          data-state="expanded"
        >
          <div className={s.mobileContent}>{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.root} data-state={state} {...rest}>
      <div className={s.gap}></div>
      <div className={s.content}>
        <div className={s.panel}>{children}</div>
      </div>
    </div>
  );
};
