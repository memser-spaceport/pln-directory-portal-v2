'use client';

import React, { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { NavigationMenu } from '@base-ui-components/react';

import { NavItemWithMenu } from '@/components/core/navbar/components/NavItemWithMenu';
import { AiSearchIcon } from '@/prototypes/components/AiSearchIcon/AiSearchIcon';
import {
  DIRECTORY_LINKS,
  EVENT_LINKS,
  JOBS_LINK,
  DEALS_LINK,
  FOUNDER_GUIDES_LINK,
} from '@/components/core/navbar/constants/navLinks';
import {
  AppLogo,
  CPUIcons,
  HelpIcon,
  ForumIcon,
  EventsIcon,
  DemoDayIcon,
  DirectoryIcon,
  MoreIcon,
} from '@/components/core/navbar/components/icons';

// Reuse the production navbar styling 1:1 — every class below is production's.
import s from '@/components/core/navbar/NavBar.module.scss';
import signup from '@/components/core/navbar/components/Signup/Signup.module.scss';
import login from '@/components/core/navbar/components/LoginBtn/LoginButton.module.scss';
// The 12px/500 brand text button the search surfaces' "Clear" wears.
import sub from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader/ChatSubheader.module.scss';
import local from './PrototypeNav.module.scss';
import help from './HelpFeedbackMenu.module.scss';

import { HomeIcon, BellIcon, SearchGlyph } from './icons';
import { LOGO_LABEL, scrollToTop } from './home';
import { PrototypeSearchModal } from './PrototypeSearchModal';
import { HelpFeedbackMenu, type HelpFeedbackMenuProps } from './HelpFeedbackMenu';
import { PL_INFRA_LINKS } from './plInfraLinks';
import { PageCommentMode } from '../feedback-shared/PageCommentMode';

/**
 * Copy of the production `Navbar` (components/core/navbar/nav-bar.tsx) with the
 * proposal applied: a **Home** item, first in the list, pointing at the same
 * `/home` the logo already points at. Labelled Home rather than News — it is
 * the landing page, and the feed is what's on it; the dot is what says the feed
 * moved. Identifiers below still say "news" because that's what the signal
 * counts, not what the item is called.
 *
 * The other half of the proposal is what this does to the **logo**. In
 * production the logo is the *only* route to the feed (`nav-bar.tsx:94`, an
 * unlabelled 48px SVG), which makes an unnamed glyph load-bearing. Here it
 * resolves to exactly where Home resolves and gains an accessible name, so it
 * becomes the redundant escape hatch a logo should be. The unread dot stays on
 * the labelled item and never rides the logo: a dot on a wordmark reads as a
 * badge on the whole app, which is not what it means.
 *
 * Shared (prototypes/entries/nav-shared/, no registry entry — like
 * follow-shared/): the item is the same proposal wherever a prototype needs the
 * header, so one copy rather than one per entry.
 *
 * Deliberately simplified — the real navbar reads the auth store, RBAC access
 * hooks and the notifications query to decide what to render; none of that
 * changes what this prototype is asking about, so the right-hand cluster
 * (bell, account) is static and the Demo Day / More items render their
 * un-gated variants. Search is the exception, and only where an entry asks for
 * it: `searchable` makes the glyph open `PrototypeSearchModal`, which runs the
 * real global search. Everything on the left is the real component (
 * `NavItemWithMenu`) with the real link constants, so the new item is judged
 * next to its actual neighbours rather than approximations.
 */
interface PrototypeNavBarProps {
  /** Drives the unread dot on the News item. */
  hasUnreadNews: boolean;
  /** Where News goes. Omit on a page that handles the click itself. */
  newsHref?: string;
  /** Called on click — clears the dot on pages that own the feed. */
  onNewsClick?: () => void;
  /** Whether this page *is* Home. Marks the item for assistive tech. */
  active?: boolean;
  /** Re-selecting Home while on Home: refresh in place instead of navigating. */
  onHomeReselect?: () => void;
  /**
   * Defaults to true — the static signed-in cluster is what every entry sharing
   * this file already shows, so opting out is the new behaviour, not the norm.
   * Set false on a page reviewing what a logged-out visitor sees: leaving an
   * account avatar over a "sign in" page makes the state incoherent.
   */
  isLoggedIn?: boolean;
  /**
   * The **PL Infra** selector, last in the row as in production
   * (`nav-bar.tsx:183`, after More). Defaults to on, the same way Demo Day and
   * More render their un-gated variants here: RBAC is not what these prototypes
   * are asking about. It still hides while `isLoggedIn` is false — nobody sees
   * PL Infra logged out, and a locked door with your name off it is not a
   * preview — so a page reviewing the signed-out state needs no extra prop.
   *
   * The bottom bar's `plInfra` is the same slot and a different decision: there
   * it costs Events its place, so the host has to ask for it.
   */
  plInfra?: boolean;
  /** What Sign in does while `isLoggedIn` is false — and Sign up too, unless
   *  `onSignUp` is given. */
  onSignIn?: () => void;
  /**
   * What Sign up does, when it is a different door from Sign in.
   *
   * Optional, falling back to `onSignIn`, because for most entries sharing this
   * header the pair is decorative and either click just signs the mock in. The
   * job board is the exception: there, signing up opens a real form that creates
   * the account, so the two buttons genuinely lead to different places and the
   * header has to be able to say so.
   */
  onSignUp?: () => void;
  /**
   * Turns the header search glyph into a real trigger for `PrototypeSearchModal`.
   * Off by default — every other entry sharing this header keeps the inert
   * stand-in it has today, so opting in is the new behaviour, not the norm.
   */
  searchable?: boolean;
  /**
   * Replaces the inert (?) with the proposed help & feedback menu (see
   * HelpFeedbackMenu). Off by default for the same reason as `searchable`:
   * every other entry sharing this header keeps the stand-in it has today.
   * `askAi` adds the optional "Ask AI" item, which opens the search overlay
   * (needs `searchable`); `key` remounts the menu, for re-showing the callout.
   */
  helpMenu?: Pick<HelpFeedbackMenuProps, 'onPickTopic' | 'callout'> & { askAi?: boolean; key?: string };
  /**
   * Controlled form of the search dialog's open state, for pages that also
   * open it from somewhere other than the icon (a ⌘K shortcut, a page button).
   * Omit both and the bar keeps its own state, as every other entry does.
   */
  searchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  /**
   * A different dialog behind the same icon. Defaults to `PrototypeSearchModal`
   * (the live global search); the `ai-search` entry passes its own mocked one.
   * Only read while `searchable`.
   */
  renderSearchModal?: (open: boolean, close: () => void) => React.ReactNode;
  /** Optional AI shortcut inside the desktop search field. */
  onAiSearchClick?: () => void;
  /**
   * Makes the desktop header field the **real** field: you type here, it widens
   * over the nav while search is open, and whatever `renderSearchModal` draws
   * hangs under it holding only results. Without it the field is a button that
   * opens a dialog whose first row is a second field — two fields in a row for
   * one search, which is why production shrank its own to a glyph.
   *
   * The host owns the term (it outlives the popover). Below tablet-landscape
   * the header has no room for a field, so the glyph button stays and the
   * popover keeps its own. Only read while `searchable`.
   */
  searchField?: { value: string; onChange: (value: string) => void; placeholder?: string };
  /**
   * Unread dot on the bell — the news item's own 6px marker, on the control
   * that holds what happened to *you*. The bell itself stays static.
   */
  bellDot?: boolean;
}

/** What the popover hangs under, in both the glyph and the field form. */
export const SEARCH_ANCHOR_SELECTOR = 'header [data-search-anchor]';
/** The bell, for a guided tour that starts from a notification. */
export const BELL_ANCHOR_SELECTOR = 'header [data-tour="bell"]';

export function PrototypeNavBar({
  hasUnreadNews,
  newsHref,
  onNewsClick,
  active = false,
  onHomeReselect,
  isLoggedIn = true,
  plInfra = true,
  onSignIn,
  onSignUp,
  searchable = false,
  helpMenu,
  searchOpen: controlledOpen,
  onSearchOpenChange,
  renderSearchModal,
  onAiSearchClick,
  searchField,
  bellDot = false,
}: PrototypeNavBarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  /* Giving feedback is a mode of the page, not a form over it: the header's
     door switches on comment mode (feedback-shared/PageCommentMode) — point at
     the thing, a pin drops, the composer opens with that element's picture
     attached. Owned here so every entry wearing this bar gets it, the way the
     real header would give it to every page. */
  const [commenting, setCommenting] = useState(false);
  const searchOpen = controlledOpen ?? internalOpen;
  const setSearchOpen = (open: boolean) => {
    setInternalOpen(open);
    onSearchOpenChange?.(open);
  };

  /* Open and focused are one state for the header field. Search can open from
     elsewhere (⌘K, a page button, the AI view's Back), so the caret follows the
     flag rather than the other way round; a term kept from the last visit opens
     selected, so the next keystroke replaces it. Closing by Escape leaves focus
     in the field, which would make the collapsed field a live one: blur it.
     `offsetParent` is null below tablet-landscape, where the field isn't drawn
     and the popover focuses its own. */
  const fieldRef = useRef<HTMLInputElement>(null);
  const hasSearchField = Boolean(searchField);
  useEffect(() => {
    const input = fieldRef.current;
    if (!hasSearchField || !input || input.offsetParent === null) return;
    if (!searchOpen) {
      if (document.activeElement === input) input.blur();
      return;
    }
    const raf = requestAnimationFrame(() => {
      input.focus();
      if (input.value) input.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [searchOpen, hasSearchField]);
  const label = hasUnreadNews ? 'Home, new items since your last visit' : 'Home';
  const inner = (
    <>
      <HomeIcon /> Home
      {/* A dot, never a count: a number turns an ambient feed into a backlog you
          owe, and is always slightly wrong besides. */}
      {hasUnreadNews && <span className={local.navDot} aria-hidden="true" />}
    </>
  );

  /* Tapping Home while already on Home is the standard feed gesture: go to the
     top and pull, don't re-navigate to the page you're looking at. Note this
     lives on the labelled item, not the logo — a logo that behaves differently
     depending on the page is a novelty nobody goes looking for. */
  const onHomeActivate = (e: React.MouseEvent) => {
    // Fires on both paths: "you went to the feed" is true whether you travelled
    // there or were already standing on it, and that's what clears the dot.
    onNewsClick?.();
    if (!active) return;
    e.preventDefault();
    scrollToTop();
    onHomeReselect?.();
  };

  return (
    <header className={local.headerShell}>
      <NavigationMenu.Root className={s.Root}>
        <NavigationMenu.List className={s.List}>
          {/* Same destination as Home, one of them labelled. `newsHref` absent
              means the page clears the dot in place, so the logo does what Home
              does there too rather than dead-ending on `#`. */}
          {newsHref ? (
            <a href={newsHref} className={s.logoWrapper} aria-label={LOGO_LABEL} onClick={onHomeActivate}>
              <AppLogo />
            </a>
          ) : (
            <button
              type="button"
              className={clsx(s.logoWrapper, local.logoButton)}
              aria-label={LOGO_LABEL}
              onClick={onHomeActivate}
            >
              <AppLogo />
            </button>
          )}

          {/* The proposal. Same markup as the Forum item below — no new pattern,
              no new route, and no active-state styling, because production's nav
              items don't have one. `aria-current` carries the state instead: it
              costs no pixels and invents nothing. */}
          <NavigationMenu.Item className={s.menuItem}>
            {newsHref ? (
              <a
                className={clsx(s.Trigger, local.newsTrigger)}
                href={newsHref}
                onClick={onHomeActivate}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                {inner}
              </a>
            ) : (
              <button
                type="button"
                className={clsx(s.Trigger, local.newsTrigger)}
                onClick={onHomeActivate}
                aria-label={label}
                aria-current={active ? 'page' : undefined}
              >
                {inner}
              </button>
            )}
          </NavigationMenu.Item>

          <NavItemWithMenu
            icon={<DirectoryIcon />}
            label="Directory"
            items={DIRECTORY_LINKS}
            onNavItemClickHandler={() => {}}
          />

          <NavItemWithMenu icon={<EventsIcon />} label="Events" items={EVENT_LINKS} onNavItemClickHandler={() => {}} />

          <NavigationMenu.Item className={s.menuItem}>
            <a className={s.Trigger} href="#" onClick={(e) => e.preventDefault()}>
              <ForumIcon /> Forum
            </a>
          </NavigationMenu.Item>

          <NavigationMenu.Item className={s.menuItem}>
            <a className={s.Trigger} href="#" onClick={(e) => e.preventDefault()}>
              <DemoDayIcon /> Demo Day
            </a>
          </NavigationMenu.Item>

          <NavItemWithMenu
            icon={<MoreIcon />}
            label="More"
            items={[JOBS_LINK, DEALS_LINK, FOUNDER_GUIDES_LINK]}
            onNavItemClickHandler={() => {}}
          />

          {/* PL Infra, holding the proposed **Hiring** entry (plInfraLinks.tsx).
              Last in the row and `CPUIcons`, both production's: the desktop bar
              renders `PLInfraNavItems` after More, and only the bottom bar uses
              StarFour for the same selector — so each bar keeps the mark its own
              production copy has. */}
          {plInfra && isLoggedIn ? (
            <NavItemWithMenu
              icon={<CPUIcons />}
              label="PL Infra"
              items={PL_INFRA_LINKS}
              onNavItemClickHandler={() => {}}
            />
          ) : null}

          <div className={s.right}>
            {/* The one item in this cluster that does something. Production wires
                it to `ApplicationSearch` — an inline field in this row that grows
                a dropdown, then promotes itself to an overlay on Enter. Here the
                icon opens that overlay directly; see PrototypeSearchModal. */}
            {searchable && searchField ? (
              <div className={local.navSearchSlot} data-search-anchor>
                {/* Below tablet-landscape: the glyph box, opening the popover
                    with its own field. */}
                <button
                  type="button"
                  className={clsx(local.navSearch, local.navSearchTrigger, local.navSearchCompact)}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                >
                  <SearchGlyph />
                </button>
                {/* From tablet-landscape up: the field itself. The slot keeps
                    its 200px in the row; the field is anchored to the slot's
                    right edge and widens leftward over the nav, so nothing in
                    the bar reflows while you search. */}
                <div
                  className={clsx(local.navSearchField, searchOpen && local.navSearchFieldOpen)}
                  /* The glyph and the padding are the field too. */
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).closest('input, button')) return;
                    e.preventDefault();
                    fieldRef.current?.focus();
                  }}
                >
                  <SearchGlyph />
                  <input
                    ref={fieldRef}
                    type="text"
                    className={local.navSearchInput}
                    value={searchField.value}
                    onChange={(e) => {
                      searchField.onChange(e.target.value);
                      if (!searchOpen) setSearchOpen(true);
                    }}
                    onFocus={() => !searchOpen && setSearchOpen(true)}
                    onClick={() => !searchOpen && setSearchOpen(true)}
                    placeholder={searchOpen ? (searchField.placeholder ?? 'Search') : 'Search'}
                    aria-label="Search"
                    aria-expanded={searchOpen}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {/* The word, as in the AI view's field: one text-button
                      lineage for emptying a search. Only while open — the
                      collapsed field has no room for it beside a kept term. */}
                  {searchOpen && searchField.value && (
                    <button
                      type="button"
                      className={clsx(sub.button, local.navSearchClear)}
                      onClick={() => {
                        searchField.onChange('');
                        fieldRef.current?.focus();
                      }}
                    >
                      Clear
                    </button>
                  )}
                  {onAiSearchClick && (
                    <button
                      type="button"
                      className={clsx(local.navAiBadge, local.navAiBadgeInline)}
                      onClick={onAiSearchClick}
                      aria-label="Open AI Search"
                    >
                      <AiSearchIcon size={16} />
                      AI
                    </button>
                  )}
                </div>
              </div>
            ) : searchable ? (
              <div className={clsx(onAiSearchClick && local.navSearchWithAi)} data-search-anchor>
                <button
                  type="button"
                  className={clsx(
                    local.navSearch,
                    local.navSearchTrigger,
                    onAiSearchClick && local.navSearchWithAiTrigger,
                  )}
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                >
                  <SearchGlyph />
                  <span className={local.navSearchLabel}>Search</span>
                </button>
                {onAiSearchClick && (
                  <button
                    type="button"
                    className={local.navAiBadge}
                    onClick={onAiSearchClick}
                    aria-label="Open AI Search"
                  >
                    <AiSearchIcon size={16} />
                    AI
                  </button>
                )}
              </div>
            ) : (
              <span className={local.navSearch} aria-hidden="true">
                <SearchGlyph />
                <span className={local.navSearchLabel}>Search</span>
              </span>
            )}
            {helpMenu ? (
              <HelpFeedbackMenu
                key={helpMenu.key}
                onPickTopic={helpMenu.onPickTopic}
                onGiveFeedback={() => setCommenting(true)}
                callout={helpMenu.callout}
                onAskAi={helpMenu.askAi ? () => setSearchOpen(true) : undefined}
              />
            ) : (
              /* No topic menu on this entry, so the door has its one job: a
                 press switches comment mode on. */
              <button
                type="button"
                className={clsx(help.contact, help.trigger)}
                aria-label="Give feedback"
                onClick={() => setCommenting(true)}
              >
                <HelpIcon />
                <span className={help.contactLabel}>Contact us</span>
              </button>
            )}
            {/* Logged out, the bell goes with the account: notifications with
                nobody to notify is a control that can't mean anything. Same shape
                production uses (nav-bar.tsx `.signInWrapper`), wearing the real
                Signup / LoginBtn stylesheets but wired to the page rather than to
                Privy — the entries using this switch viewer state locally, and a
                real login would navigate away from the thing under review. */}
            {isLoggedIn ? (
              <>
                <span className={clsx(local.navIconButton, local.navBell)} data-tour="bell" aria-hidden="true">
                  <BellIcon />
                  {bellDot && <span className={local.bellDot} />}
                </span>
                <span className={local.navAvatar} aria-hidden="true">
                  PB
                </span>
              </>
            ) : (
              <div className={s.signInWrapper}>
                <button type="button" className={signup.root} onClick={onSignUp ?? onSignIn}>
                  Sign up
                </button>
                <button type="button" className={login.root} onClick={onSignIn}>
                  Sign in
                </button>
              </div>
            )}
          </div>
        </NavigationMenu.List>
        {/* Where every menu in this bar is drawn. `NavItemWithMenu` renders its
            links into the Root's viewport, so without this block the triggers
            open — chevron flips, the item tints — and paint nothing: Directory,
            Events and More have all been inert here, not just the new PL Infra
            item. Production's own block, verbatim (nav-bar.tsx:213), classes and
            offsets included. */}
        <NavigationMenu.Portal>
          <NavigationMenu.Positioner
            className={s.Positioner}
            sideOffset={10}
            collisionPadding={{ top: 5, bottom: 5, left: 20, right: 20 }}
          >
            <NavigationMenu.Popup className={s.Popup}>
              <NavigationMenu.Viewport className={s.Viewport} />
            </NavigationMenu.Popup>
          </NavigationMenu.Positioner>
        </NavigationMenu.Portal>
      </NavigationMenu.Root>

      {searchable &&
        (renderSearchModal ? (
          renderSearchModal(searchOpen, () => setSearchOpen(false))
        ) : (
          <PrototypeSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
        ))}

      <PageCommentMode active={commenting} onExit={() => setCommenting(false)} />
    </header>
  );
}
