'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { AppLogo } from '@/components/core/navbar/components/icons';
// Production's navbar shell and item style, by class, as SpvNavBar uses them.
import n from '@/components/core/navbar/NavBar.module.scss';
import spv from '../spv-spotlight/SpvSpotlight.module.scss';
import s from './ExplorePlNetwork.module.scss';

export type NavSection = { id: string; label: string };

type Props = {
  label: string;
  sections: NavSection[];
  supportEmail?: string;
};

/**
 * SpvNavBar with the page's sections as links: the bar is the table of
 * contents. Each link scrolls to its section (sections carry scroll-margin for
 * the sticky bar), and the section under the bar is marked as current. Below
 * tablet-landscape the links drop to a second row that scrolls sideways.
 */
export const SectionNavBar = ({ label, sections, supportEmail }: Props) => {
  const [active, setActive] = useState<string | null>(null);

  // The body scrolls in this app, not the document, so listen in capture.
  useEffect(() => {
    const onScroll = () => {
      const bar = document.getElementById('explore-section-nav')?.getBoundingClientRect().bottom ?? 64;
      let current: string | null = null;
      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= bar + 48) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [sections]);

  // On phones the links are a sideways strip: keep the current one in it.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navRef.current;
    const link = nav?.querySelector<HTMLElement>('[aria-current]');
    if (!nav || !link || nav.scrollWidth <= nav.clientWidth) return;
    const { left, right } = link.getBoundingClientRect();
    const box = nav.getBoundingClientRect();
    if (left < box.left || right > box.right) {
      nav.scrollTo({ left: nav.scrollLeft + left - box.left - 16, behavior: 'smooth' });
    }
  }, [active]);

  const go = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  };

  const toTop = () => {
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
  };

  return (
    <header id="explore-section-nav" className={clsx(n.Root, spv.navBar, s.secBar)}>
      <button type="button" className={clsx(spv.navBrand, s.secBrand)} onClick={toTop} aria-label="Back to top">
        <span className={n.logoWrapper} aria-hidden>
          <AppLogo />
        </span>
        <span className={spv.navLabel}>{label}</span>
      </button>

      <nav ref={navRef} className={s.secNav} aria-label="Sections">
        <ul className={s.secList}>
          {sections.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={go(id)}
                className={clsx(n.Trigger, spv.navLink, s.secLink, { [s.secLinkActive]: active === id })}
                aria-current={active === id ? 'location' : undefined}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {supportEmail && (
        <div className={clsx(n.right, s.secRight)}>
          <a className={clsx(n.Trigger, spv.navLink, s.secLink)} href={`mailto:${supportEmail}`}>
            Contact us
          </a>
        </div>
      )}
    </header>
  );
};
