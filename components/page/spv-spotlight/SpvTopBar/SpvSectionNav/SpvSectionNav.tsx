'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import s from './SpvSectionNav.module.scss';

export type SpvSection = { id: string; label: string };

/** Where the click came from: the links beside the mark, or their second row on narrow screens. */
export type SpvSectionSource = 'header' | 'header-mobile';

type Props = {
  sections: readonly SpvSection[];
  tone?: 'light' | 'dark';
  onSectionClick?: (id: string, source: SpvSectionSource) => void;
};

// Matches .nav's second-row media query (below media.desktop).
const SECOND_ROW_QUERY = '(max-width: 1199px)';
// A section counts as current once its top is this close under the bar.
const ACTIVE_OFFSET = 48;

const isScrolledToEnd = () =>
  [document.body, document.documentElement].some(
    (el) => el.scrollHeight > el.clientHeight && el.scrollTop + el.clientHeight >= el.scrollHeight - 2,
  );

/**
 * The page's sections as links in the top bar: the bar is the table of
 * contents. A link scrolls to its section (the sections carry a scroll margin
 * for the sticky bar), and the section under the bar is marked as current.
 * Below desktop the links drop to a second row that scrolls sideways.
 */
export const SpvSectionNav = ({ sections, tone = 'light', onSectionClick }: Props) => {
  const [active, setActive] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // The body scrolls in this app, not the document, so listen in capture;
  // one measure per frame.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bar = navRef.current?.closest('header')?.getBoundingClientRect().bottom || 64;
      let current: string | null = null;
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= bar + ACTIVE_OFFSET) current = id;
      }
      // At the end of the page the last section may never reach the bar.
      if (current && isScrolledToEnd()) current = sections[sections.length - 1].id;
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [sections]);

  // A shared link (#portfolio) opens at its section once the page has drawn.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (sections.some((x) => x.id === id)) document.getElementById(id)?.scrollIntoView({ block: 'start' });
  }, [sections]);

  // In the sideways row, keep the current link in view. Not smooth: the page
  // may be in a smooth scroll to the clicked section.
  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLElement>('[aria-current]');
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return;
    const { left, right } = link.getBoundingClientRect();
    const box = nav.getBoundingClientRect();
    if (left < box.left || right > box.right) {
      nav.scrollLeft += left - box.left - 16;
    }
  }, [active]);

  const go = (id: string) => (e: React.MouseEvent) => {
    // A new tab or window keeps the browser's own handling of #id.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
    const secondRow = window.matchMedia?.(SECOND_ROW_QUERY).matches;
    onSectionClick?.(id, secondRow ? 'header-mobile' : 'header');
  };

  return (
    <nav ref={navRef} className={clsx(s.nav, { [s.dark]: tone === 'dark' })} aria-label="Sections">
      <ul className={s.list}>
        {sections.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              onClick={go(id)}
              className={clsx(s.link, { [s.active]: active === id })}
              aria-current={active === id ? 'location' : undefined}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};
