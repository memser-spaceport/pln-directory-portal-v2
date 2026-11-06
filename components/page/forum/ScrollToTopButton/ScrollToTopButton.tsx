'use client';

import clsx from 'clsx';
import React, { useEffect, useState } from 'react';

import { useScrollDirection } from '@/components/core/MobileBottomNav';

import s from './ScrollToTopButton.module.scss';

interface Props {
  /**
   * When the button shows.
   * - `scrolling-down` (the forum): while the reader scrolls down, as the mobile bottom bar hides, so the two take turns.
   * - `scrolled` (Home's news page, LAB-3164): once the reader is more than a screen down, in either direction, so it is
   *   there when they want to go back up. On phones it sits above the bottom bar and the feedback button.
   */
  showWhen?: 'scrolling-down' | 'scrolled';
  /** For analytics, after the scroll starts. */
  onClick?: () => void;
}

export const ScrollToTopButton = ({ showWhen = 'scrolling-down', onClick }: Props) => {
  const scrollDirection = useScrollDirection();
  const scrolledPastScreen = useScrolledPastScreen(showWhen === 'scrolled');
  const visible = showWhen === 'scrolled' ? scrolledPastScreen : scrollDirection === 'down';

  const scrollToTop = () => {
    // <body> is the page's scroller (globals.scss), not the window.
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    onClick?.();
  };

  return (
    <button
      type="button"
      aria-label="Back to top"
      className={clsx(s.root, {
        [s.visible]: visible,
        [s.aboveBottomBar]: showWhen === 'scrolled',
      })}
      onClick={scrollToTop}
      // Faded out, it is not there: keep it out of the tab order and the accessibility tree.
      tabIndex={visible ? undefined : -1}
      aria-hidden={visible ? undefined : true}
      /* The LabOS-wide feedback button moves up while this is on the page (LAB-2879). */
      data-floating-corner-control=""
    >
      <ArrowUpIcon />
    </button>
  );
};

/** True once `<body>` is scrolled more than one viewport down. Only listens when `enabled`. */
function useScrolledPastScreen(enabled: boolean) {
  const [past, setPast] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const update = () => setPast(document.body.scrollTop > window.innerHeight);
    update();
    document.body.addEventListener('scroll', update, { passive: true });
    return () => document.body.removeEventListener('scroll', update);
  }, [enabled]);

  return past;
}

const ArrowUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path
      d="M16.9137 13.1634C16.8266 13.2508 16.7231 13.3202 16.6092 13.3675C16.4952 13.4148 16.3731 13.4392 16.2497 13.4392C16.1263 13.4392 16.0041 13.4148 15.8902 13.3675C15.7762 13.3202 15.6727 13.2508 15.5856 13.1634L10.0005 7.57828L4.41374 13.1634C4.23762 13.3396 3.99874 13.4385 3.74967 13.4385C3.5006 13.4385 3.26173 13.3396 3.08561 13.1634C2.90949 12.9873 2.81055 12.7484 2.81055 12.4994C2.81055 12.2503 2.90949 12.0114 3.08561 11.8353L9.33561 5.58531C9.42271 5.49791 9.5262 5.42856 9.64016 5.38124C9.75411 5.33393 9.87628 5.30957 9.99967 5.30957C10.1231 5.30957 10.2452 5.33393 10.3592 5.38124C10.4731 5.42856 10.5766 5.49791 10.6637 5.58531L16.9137 11.8353C17.0011 11.9224 17.0705 12.0259 17.1178 12.1399C17.1651 12.2538 17.1895 12.376 17.1895 12.4994C17.1895 12.6228 17.1651 12.7449 17.1178 12.8589C17.0705 12.9728 17.0011 13.0763 16.9137 13.1634Z"
      fill="#1B4DFF"
    />
  </svg>
);
