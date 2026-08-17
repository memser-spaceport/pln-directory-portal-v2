'use client';

// Back Office — the top navbar that sits above every admin screen.
// Transcribed from the header component in "Back Office | Protocol Labs"
// (file r1B2INuN2xKR31z9oDQWWt, node 426:33970), read live off Figma rather
// than eyeballed: the 80px bar, the 48/16 padding, the 32px logo→menu gap, the
// 16px item gap, the 40px tab items at 12px padding / 6px radius, the 20px
// glyphs, the 16/24/-0.3px label and the 24px sign-out button are all its
// numbers, and the icons are its exported assets (see SpotlightIcons.tsx).
//
// REUSE MAP
//  - SpotlightIcons — the sibling icon file this prototype already keeps, one
//    component per exported glyph. Nothing new was drawn by hand.
//  - No production component fits: portal-v2's SiteHeader is a different app's
//    chrome with real auth and routing in it, and components/icons only carries
//    two of the nine glyphs (UsersThreeIcon, ChevronDownIcon) — and both at the
//    wrong weight/box for this bar, so importing them would have mixed two icon
//    sets inside one row. The exported assets win.
//  - The bar is nonetheless colored in PL tokens, not Tailwind grays: Figma
//    reports #455468 for the labels and #8897ae for the sign-out, which are
//    exactly --foreground-neutral-secondary / --foreground-neutral-tertiary.
//    So the navbar is the one part of this prototype whose token names are
//    verified rather than placeholders.
//
// WHAT THE FRAME COULD NOT SHOW, AND SO WAS DECIDED HERE
//  - Which items carry a chevron. The frame's live instance chevrons
//    Recommendations / Demo Days / IRL Gathering; the screenshot this was built
//    against chevrons Members / Teams / Demo Days / IRL Gathering and hides
//    Recommendations altogether. The screenshot won — the item set here is
//    Members, Teams, Demo Days, IRL Gathering, Deals, Guides.
//  - Dropdown contents. The frame ships exactly one open menu ("New Team" /
//    "New Member" under an Add control) and none for these four. The panels
//    below reuse that menu's real geometry (272px panel, 12/8px rows, 20px
//    radius, 14/20/-0.2px labels) and invent plausible back-office destinations
//    for it — they are labels on nothing, not a claim about the real IA.
//  - Menu rows are text-only. The frame's row has a leading 20px and a trailing
//    16px glyph; those exports belong to items this navbar does not have, and
//    hand-drawing stand-ins would have put invented art next to traced art.
//  - Open/hover/active states. A static frame has none. Hover tints the row
//    background and darkens the label; an open trigger keeps that tint so the
//    panel reads as attached to it.
//  - Nothing navigates. Triggers are <button>s, leaf items are href="#" links
//    that preventDefault, and sign-out only clears the locally "open" menu —
//    a prototype never routes or authenticates.
//  - Settings is NOT in the frame at all. Everything above is transcription;
//    this one item is a placement proposal, put into the real bar so it can be
//    judged where it will actually live rather than argued about in the
//    abstract. Three things about it were decided here:
//      · It goes last, after Guides. The row already has a shape: domain items
//        first (Members / Teams / Demo Days / IRL Gathering — the things that
//        have records behind them), then non-domain utility items last and
//        chevron-less (Deals, Guides). Settings is utility. Putting it in the
//        utility slot keeps that split legible; putting it among the domain
//        items would make it read as a seventh kind of record.
//      · It gets no chevron and no dropdown, on purpose. The thing it is
//        eventually for is an "Email templates" surface — the wording of the
//        invite mail that inviteTemplate.ts and InviteEmailModal.tsx currently
//        only let you edit one send at a time. A dropdown holding exactly one
//        link is a click that reveals nothing, so Email templates becomes a
//        section on a settings page rather than a menu entry, and the nav item
//        stays plain until there is genuinely more than one thing behind it.
//      · Its icon is traced, not drawn: Icon / Gear at Weight=Fill, pulled from
//        the same shared library as the other eight (see SpotlightIcons.tsx).
//    Behaviour is identical to Deals and Guides — sets the active item, closes
//    any open menu, goes nowhere.

import { useEffect, useRef, useState, type ComponentType } from 'react';
import {
  NavCaretDownIcon,
  NavDealsIcon,
  NavDemoDaysIcon,
  NavGuidesIcon,
  NavIrlGatheringIcon,
  NavMembersIcon,
  NavSettingsIcon,
  NavSignOutIcon,
  NavTeamsIcon,
  ProtocolLabsWordmarkIcon,
} from './SpotlightIcons';
import s from './BackOfficeNavbar.module.scss';

type NavItem = {
  key: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** Present ⇒ the item is a dropdown trigger; absent ⇒ a plain destination. */
  menu?: string[];
};

const NAV_ITEMS: NavItem[] = [
  {
    key: 'members',
    label: 'Members',
    Icon: NavMembersIcon,
    menu: ['All members', 'Pending approvals', 'Access levels'],
  },
  { key: 'teams', label: 'Teams', Icon: NavTeamsIcon, menu: ['All teams', 'Pending approvals', 'Focus areas'] },
  {
    key: 'demo-days',
    label: 'Demo Days',
    Icon: NavDemoDaysIcon,
    menu: ['Upcoming demo day', 'Past demo days', 'PL Spotlight', 'Investor access'],
  },
  {
    key: 'irl-gathering',
    label: 'IRL Gathering',
    Icon: NavIrlGatheringIcon,
    menu: ['Upcoming gatherings', 'Past gatherings', 'Attendee lists'],
  },
  { key: 'deals', label: 'Deals', Icon: NavDealsIcon },
  { key: 'guides', label: 'Guides', Icon: NavGuidesIcon },
  // Not in the frame — a placement proposal. See the header note.
  { key: 'settings', label: 'Settings', Icon: NavSettingsIcon },
];

export default function BackOfficeNavbar() {
  // Which trigger is open, and which item is "the page you are on". Both are
  // local state over mock labels — neither reads or writes a route.
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string>('members');
  const navRef = useRef<HTMLElement>(null);

  // Click-away and Escape. A menu you cannot dismiss reads as broken even in a
  // prototype, and this is the cheapest honest version of it.
  useEffect(() => {
    if (!openKey) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenKey(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenKey(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openKey]);

  const handleTriggerClick = (item: NavItem) => {
    if (!item.menu) {
      setActiveKey(item.key);
      setOpenKey(null);
      return;
    }
    setOpenKey((current) => (current === item.key ? null : item.key));
  };

  const handleMenuItemClick = (item: NavItem, event: React.MouseEvent<HTMLAnchorElement>) => {
    // Mocked target — prototypes never link out to a real screen.
    event.preventDefault();
    setActiveKey(item.key);
    setOpenKey(null);
  };

  return (
    <header className={s.bar} ref={navRef}>
      <div className={s.left}>
        {/* 192×48 in the frame: the exported mark carries the cube and the
            "Protocol Labs" line, and only "Admin Directory" is live text. */}
        <div className={s.logo}>
          <ProtocolLabsWordmarkIcon className={s.logoMark} />
          <span className={s.logoLine2}>Admin Directory</span>
        </div>

        <nav className={s.menuItems} aria-label="Back office">
          {NAV_ITEMS.map((item) => {
            const isOpen = openKey === item.key;
            const isActive = activeKey === item.key;
            return (
              <div className={s.navItem} key={item.key}>
                <button
                  type="button"
                  className={`${s.tabItem} ${isOpen ? s.tabItemOpen : ''} ${isActive ? s.tabItemActive : ''}`}
                  onClick={() => handleTriggerClick(item)}
                  aria-expanded={item.menu ? isOpen : undefined}
                  aria-haspopup={item.menu ? 'menu' : undefined}
                >
                  <item.Icon className={s.tabIcon} />
                  <span className={s.tabLabel}>{item.label}</span>
                  {item.menu ? <NavCaretDownIcon className={`${s.tabCaret} ${isOpen ? s.tabCaretOpen : ''}`} /> : null}
                </button>

                {item.menu && isOpen ? (
                  <div className={s.menu} role="menu" aria-label={item.label}>
                    {item.menu.map((entry) => (
                      <a
                        key={entry}
                        className={s.menuItem}
                        href="#"
                        role="menuitem"
                        onClick={(event) => handleMenuItemClick(item, event)}
                      >
                        {entry}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>

      {/* The frame's only right-hand control: an icon button, no label, no user
          menu. Signing out is mocked down to closing whatever is open. */}
      <button type="button" className={s.signOut} aria-label="Sign out" onClick={() => setOpenKey(null)}>
        <NavSignOutIcon className={s.signOutIcon} />
      </button>
    </header>
  );
}
