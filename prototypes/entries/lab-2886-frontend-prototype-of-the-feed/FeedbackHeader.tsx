'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import clsx from 'clsx';

import { CommentIcon } from '@/components/icons';

import { BellIcon, SearchGlyph } from '../nav-shared/icons';
import { LABEL_MS, MENU_ITEMS, MOCK_MEMBER, NAV_ITEMS, type MenuAction } from './mocks';
import s from './FeedbackHeader.module.scss';

interface Props {
  signedIn: boolean;
  /** A menu item or the icon was chosen. `topic` is the menu label. */
  onAction: (action: MenuAction, topic: string) => void;
}

/**
 * A copy-simplified LabOS header (production: components/core/navbar/nav-bar.tsx).
 * Search, notifications and the account menu are static stand-ins.
 *
 * The change (LAB-2880 option 4, with Anuj's decision of 2026-10-16):
 * - The chat icon of the AI Apps feedback button takes the seat of the "?", after search.
 * - On desktop the search bar moves left by a fixed room. The "Give feedback" label
 *   floats in that room, so nothing moves when the label goes.
 * - Below 960px there is no room in the row, so the label opens below the icon.
 * - With a mouse, a click opens the feedback drawer and a hover shows the menu.
 *   On touch and with the keyboard, a press opens the menu.
 */
export function FeedbackHeader({ signedIn, onAction }: Props) {
  // The header stays mounted across page changes, so the label shows on a full page load only.
  const [labelOn, setLabelOn] = useState(true);
  useEffect(() => {
    const t = window.setTimeout(() => setLabelOn(false), LABEL_MS);
    return () => window.clearTimeout(t);
  }, []);

  const [menuOpen, setMenuOpen] = useState(false);
  const hoverTimer = useRef<number | undefined>(undefined);
  const pointerType = useRef<string>('');

  const hoverOpen = (open: boolean) => (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setMenuOpen(open), open ? 120 : 180);
  };

  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  const onIconClick = () => {
    setLabelOn(false);
    if (pointerType.current === 'mouse') {
      setMenuOpen(false);
      onAction('feedback', 'Give feedback');
    } else {
      setMenuOpen((open) => !open);
    }
    pointerType.current = '';
  };

  const pick = (action: MenuAction, topic: string) => {
    setMenuOpen(false);
    onAction(action, topic);
  };

  return (
    <header className={s.root} data-feedback-header>
      <div className={s.logo} aria-label="LabOS home">
        <span className={s.logoMark}>PL</span>
        <span className={s.logoText}>LabOS</span>
      </div>

      <nav className={s.nav}>
        {NAV_ITEMS.map((item) => (
          <span key={item} className={s.navItem}>
            {item}
          </span>
        ))}
      </nav>

      <div className={s.right}>
        <button type="button" className={s.searchBar} aria-label="Search">
          <SearchGlyph />
          <span className={s.searchText}>Search</span>
        </button>

        {/* Room for the label on desktop. It stays when the label goes, so search does not jump. */}
        <span className={s.labelRoom} aria-hidden />

        <div className={s.feedbackSeat} onPointerEnter={hoverOpen(true)} onPointerLeave={hoverOpen(false)}>
          <button
            type="button"
            className={clsx(s.iconButton, menuOpen && s.iconButtonActive)}
            aria-label="Help and feedback"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onPointerDown={(e) => {
              pointerType.current = e.pointerType;
            }}
            onClick={onIconClick}
          >
            <CommentIcon />
          </button>

          <span className={clsx(s.label, labelOn && s.labelOn)} aria-hidden={!labelOn}>
            Give feedback <kbd className={s.kbd}>Alt F</kbd>
          </span>

          {menuOpen && (
            <div className={s.menu} role="menu">
              {MENU_ITEMS.map((item, i) => (
                <div key={item.label}>
                  {i === 2 && <div className={s.menuSeparator} role="separator" />}
                  <button
                    type="button"
                    role="menuitem"
                    className={s.menuItem}
                    onClick={() => pick(item.action, item.label)}
                  >
                    {item.label}
                    {item.action === 'feedback' && <span className={s.menuHint}>Alt F</span>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {signedIn ? (
          <>
            <span className={s.iconButton} aria-label="Notifications">
              <BellIcon />
            </span>
            <span className={s.avatar} aria-label="Account">
              {MOCK_MEMBER.initials}
            </span>
          </>
        ) : (
          <>
            <span className={s.signUp}>Sign up</span>
            <span className={s.logIn}>Log in</span>
          </>
        )}
      </div>
    </header>
  );
}
