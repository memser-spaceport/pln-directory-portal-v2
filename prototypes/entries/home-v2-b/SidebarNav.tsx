'use client';

import clsx from 'clsx';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  DEALS_LINK,
  DEMO_DAY_LINK,
  DIRECTORY_LINKS,
  ALL_EVENTS_LINK,
  IRL_GATHERING_LINK,
  EVENT_CONTRIBUTORS_LINK,
  FOUNDER_GUIDES_LINK,
  JOBS_LINK,
} from '@/components/core/navbar/constants/navLinks';
import type { ISubItem } from '@/components/core/navbar/type';
import {
  AppLogo,
  CPUIcons,
  DirectoryIcon,
  EventsIcon,
  ForumIcon,
  MoreIcon,
} from '@/components/core/navbar/components/icons';
import { AiSearchIcon } from '@/components/icons/AiSearchIcon';

import { BellIcon, HelpGlyph, HomeIcon, SearchGlyph } from '../nav-shared/icons';
import { PL_INFRA_LINKS } from '../nav-shared/plInfraLinks';

import s from './SidebarNav.module.scss';

const EVENT_LINKS = [IRL_GATHERING_LINK, ALL_EVENTS_LINK, EVENT_CONTRIBUTORS_LINK];

const AI_SEARCH_PAGE = '/prototypes/ai-mode-results';
/** The header field's placeholder, cut to the sidebar's width. */
const SEARCH_PLACEHOLDER = 'Search or ask AI';

type Group = { id: string; icon: ReactNode; label: string; items: ISubItem[] };

/* The header's items, in the header's order (home-ai-ask's `jobsInBar` arrangement, which this page's
   header used): Job Board is an item of its own and Demo Day the last row of Events. */
const DIRECTORY: Group = { id: 'directory', icon: <DirectoryIcon />, label: 'Directory', items: DIRECTORY_LINKS };
const EVENTS: Group = { id: 'events', icon: <EventsIcon />, label: 'Events', items: [...EVENT_LINKS, DEMO_DAY_LINK] };
const MORE: Group = { id: 'more', icon: <MoreIcon />, label: 'More', items: [DEALS_LINK, FOUNDER_GUIDES_LINK] };
const PL_INFRA: Group = { id: 'pl-infra', icon: <CPUIcons />, label: 'PL Infra', items: PL_INFRA_LINKS };

/**
 * The signed-in navigation as a left sidebar instead of the top bar (home-v2-b, 2026-10-30).
 *
 * Same destinations as PrototypeNavBar, from production's own link constants and icons: the header's
 * dropdowns become sections that expand in place (a sidebar has the height a bar lacks), so Members,
 * Teams and Projects are one press from anywhere instead of two. Home is the active row. The bar's right
 * cluster moves to the edges a sidebar has: search on top under the logo (Enter opens AI Search, the
 * page the header field's AI badge opened), and notifications, help and the account at the foot.
 *
 * Desktop only (tablet-landscape up). Below that the page keeps the header and bottom bar, as a phone
 * has no room for a column of navigation.
 *
 * Agent (2026-11-02): the row under search opens the docked AgentPanel, Linear's place for its agent.
 */
export function SidebarNav({ agentOpen, onToggleAgent }: { agentOpen?: boolean; onToggleAgent?: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [term, setTerm] = useState('');

  /* Sticky at the window's top, but the prototype banner above the page pushes it down until it scrolls
     away: size the column to what is visible, so the foot (notifications, help, account) is always on
     screen. The page scrolls on <body> here, so listen in the capture phase. */
  const navRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const fit = () => {
      nav.style.height = `${window.innerHeight - Math.max(0, nav.getBoundingClientRect().top)}px`;
    };
    fit();
    document.addEventListener('scroll', fit, { capture: true, passive: true });
    window.addEventListener('resize', fit);
    return () => {
      document.removeEventListener('scroll', fit, { capture: true });
      window.removeEventListener('resize', fit);
    };
  }, []);
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const group = (g: Group) => {
    const isOpen = open.has(g.id);
    return (
      <li key={g.id}>
        <button
          type="button"
          className={s.item}
          aria-expanded={isOpen}
          aria-controls={`side-${g.id}`}
          onClick={() => toggle(g.id)}
        >
          <span className={s.icon}>{g.icon}</span>
          <span className={s.label}>{g.label}</span>
          <svg className={s.caret} viewBox="0 0 16 16" fill="none" aria-hidden>
            <path
              d={isOpen ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {isOpen && (
          <ul id={`side-${g.id}`} className={s.subList}>
            {g.items.map((it) => (
              <li key={it.title}>
                <a href={it.href} className={s.subItem}>
                  {it.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav ref={navRef} className={s.sidebar} aria-label="Main">
      <a href="/prototypes/home-v2-b?state=signed-in" className={s.logo} aria-label="Protocol Labs Directory, Home">
        <AppLogo />
      </a>

      <form
        className={s.search}
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          const q = term.trim();
          router.push(q ? `${AI_SEARCH_PAGE}?q=${encodeURIComponent(q)}` : AI_SEARCH_PAGE);
        }}
      >
        <SearchGlyph />
        <input
          className={s.searchInput}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={SEARCH_PLACEHOLDER}
          aria-label="Search"
        />
      </form>

      {onToggleAgent && (
        <button
          type="button"
          className={clsx(s.item, agentOpen && s.itemPressed)}
          aria-pressed={agentOpen}
          title="Agent (Ctrl J)"
          onClick={onToggleAgent}
        >
          <span className={s.icon}>
            <AiSearchIcon size={20} />
          </span>
          <span className={s.label}>Agent</span>
        </button>
      )}

      <ul className={s.list}>
        <li>
          <a href="/prototypes/home-v2-b?state=signed-in" className={clsx(s.item, s.itemActive)} aria-current="page">
            <span className={s.icon}>
              <HomeIcon />
            </span>
            <span className={s.label}>Home</span>
          </a>
        </li>
        {group(DIRECTORY)}
        {group(EVENTS)}
        <li>
          <a href="/prototypes/job-board" className={s.item}>
            <span className={s.icon}>{JOBS_LINK.icon}</span>
            <span className={s.label}>{JOBS_LINK.title}</span>
          </a>
        </li>
        <li>
          <a href="/forum" className={s.item}>
            <span className={s.icon}>
              <ForumIcon />
            </span>
            <span className={s.label}>Forum</span>
          </a>
        </li>
        {group(MORE)}
      </ul>

      <div className={s.divider} />
      <ul className={s.list}>{group(PL_INFRA)}</ul>

      <ul className={clsx(s.list, s.foot)}>
        <li>
          <button type="button" className={s.item}>
            <span className={s.icon}>
              <BellIcon />
            </span>
            <span className={s.label}>Notifications</span>
          </button>
        </li>
        <li>
          <button type="button" className={s.item}>
            <span className={s.icon}>
              <HelpGlyph />
            </span>
            <span className={s.label}>Help &amp; feedback</span>
          </button>
        </li>
        <li>
          <button type="button" className={clsx(s.item, s.account)}>
            <span className={s.avatar} aria-hidden>
              PB
            </span>
            <span className={s.accountText}>
              <span className={s.accountName}>Polina Bublii</span>
              <span className={s.accountMeta}>Profile and settings</span>
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
