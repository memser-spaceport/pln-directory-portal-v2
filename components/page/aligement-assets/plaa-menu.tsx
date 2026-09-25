'use client';

import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';

/*
 * Rail glyphs, drawn inline on Phosphor's 256 grid to match the icons the
 * design names in `railDef` (.design-src/Home Page.dc.html):
 *   Home house · Overview compass · Activities lightning · Profile user-circle
 *   Kudos hands-clapping · Portfolio & Holdings chart-pie-slice
 *   Leaderboard ranking · FAQ question
 * The design's `RESOURCES` group (Product Versions, Terms of Use, Privacy
 * Policy, Disclosure) carries no icons, and nav entries the design does not
 * show at all (Incentive Model, Feedback) are left bare rather than invented.
 *
 * Inlined rather than using the `ph-*` classes the prototype writes: the
 * Phosphor webfont is not a dependency of this app, so those classes render
 * nothing at all.
 *
 * `filled` swaps the outline for the solid variant on the active row.
 */
type IconProps = { filled: boolean };

const svgProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 256 256',
  'aria-hidden': true,
  focusable: 'false',
} as const;

/** Outline by default, solid when the row is active. */
const paint = (filled: boolean) => ({
  fill: filled ? 'currentColor' : 'none',
  stroke: 'currentColor',
  strokeWidth: filled ? 0 : 16,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

function HouseIcon({ filled }: IconProps) {
  return (
    <svg {...svgProps}>
      <path
        d="M216 115.5V208a8 8 0 0 1-8 8h-48a8 8 0 0 1-8-8v-48a8 8 0 0 0-8-8h-32a8 8 0 0 0-8 8v48a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8v-92.5a8 8 0 0 1 2.6-5.9l80-72.7a8 8 0 0 1 10.8 0l80 72.7a8 8 0 0 1 2.6 5.9Z"
        {...paint(filled)}
      />
    </svg>
  );
}

function RankingIcon({ filled }: IconProps) {
  return (
    <svg {...svgProps}>
      <g fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 16} strokeLinejoin="round">
        <rect x="32" y="144" width="56" height="72" rx="4" />
        <rect x="100" y="96" width="56" height="120" rx="4" />
        <rect x="168" y="48" width="56" height="168" rx="4" />
      </g>
    </svg>
  );
}

function CompassIcon({ filled }: IconProps) {
  return (
    <svg {...svgProps}>
      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeWidth="16" />
      <path d="m176 80-32 64-64 32 32-64Z" {...paint(filled)} />
    </svg>
  );
}

function LightningIcon({ filled }: IconProps) {
  return (
    <svg {...svgProps}>
      <path d="M96 240a8 8 0 0 1-7.8-9.8L104.6 152H48a8 8 0 0 1-6.1-13.2l112-128a8 8 0 0 1 13.9 7l-16.4 78.2H208a8 8 0 0 1 6.1 13.2l-112 128A8 8 0 0 1 96 240Z" {...paint(filled)} />
    </svg>
  );
}

function UserCircleIcon({ filled }: IconProps) {
  return (
    <svg {...svgProps}>
      <circle cx="128" cy="128" r="96" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="16" />
      <circle cx="128" cy="112" r="32" fill="none" stroke={filled ? 'var(--plaa-neutral-white, #fff)' : 'currentColor'} strokeWidth="16" />
      <path
        d="M64 200a72 72 0 0 1 128 0"
        fill="none"
        stroke={filled ? 'var(--plaa-neutral-white, #fff)' : 'currentColor'}
        strokeWidth="16"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HandsClappingIcon({ filled }: IconProps) {
  return (
    <svg {...svgProps}>
      <g {...paint(filled)}>
        <path d="M96 144 62 110a20 20 0 0 1 28-28l46 46" />
        <path d="M136 128 106 98a20 20 0 0 1 28-28l44 44a72 72 0 0 1-40 122 72 72 0 0 1-72-72" />
      </g>
      <g fill="none" stroke="currentColor" strokeWidth="16" strokeLinecap="round">
        <path d="M180 44 196 28M204 84h24M156 28V8" />
      </g>
    </svg>
  );
}

function ChartPieSliceIcon({ filled }: IconProps) {
  return (
    <svg {...svgProps}>
      <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeWidth="16" />
      <path d="M128 32v96h96A96 96 0 0 0 128 32Z" {...paint(filled)} />
    </svg>
  );
}

function QuestionIcon({ filled }: IconProps) {
  return (
    <svg {...svgProps}>
      <circle cx="128" cy="128" r="96" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="16" />
      <g
        fill="none"
        stroke={filled ? 'var(--plaa-neutral-white, #fff)' : 'currentColor'}
        strokeWidth="16"
        strokeLinecap="round"
      >
        <path d="M100 100a28 28 0 1 1 28 28v12" />
      </g>
      <circle cx="128" cy="180" r="10" fill={filled ? 'var(--plaa-neutral-white, #fff)' : 'currentColor'} />
    </svg>
  );
}

/* ==========================================================================
   PlaaMenu Component
   Pixel-perfect implementation based on Figma design
   Figma: https://www.figma.com/design/xrvyUEqgZ0oRNT0spUruMW/Untitled?node-id=1-5250
   ========================================================================== */

export type PlaaActiveItem =
  | 'home'
  | 'overview'
  | 'activities'
  | 'leaderboard'
  | 'incentive-model'
  | 'profile'
  | 'kudos'
  | 'terms-of-use'
  | 'privacy-policy'
  | 'product-versions'
  | 'trust-holdings'
  | 'faqs'
  | 'disclosure'
  | 'feedback';

interface PlaaMenuProps {
  activeItem?: PlaaActiveItem;
  onMenuItemClick?: () => void; // Callback to handle menu item clicks (e.g., close mobile menu)
  /** Server-resolved LabOS session. Undefined (not yet known) hides Kudos same as false. */
  isLoggedIn?: boolean;
}

const ICONS = {
  house: HouseIcon,
  compass: CompassIcon,
  lightning: LightningIcon,
  'user-circle': UserCircleIcon,
  'hands-clapping': HandsClappingIcon,
  'chart-pie-slice': ChartPieSliceIcon,
  ranking: RankingIcon,
  question: QuestionIcon,
} as const;

type MenuIcon = keyof typeof ICONS;

/* PLAA-96: the rail opens on Home and no longer surfaces the current round.
   Leaderboard sits after Trust & Holdings and before FAQ, as in the design.
   Icons follow the design's `railDef`. Entries the design does not show
   (Incentive Model, Feedback) and its icon-less RESOURCES group keep no icon.
   The RESOURCES grouping and the Portfolio & Holdings rename remain open
   questions on the ticket and are not applied here. */
const menuItems: Array<{
  name: PlaaActiveItem;
  label: string;
  url: string;
  isExternal?: boolean;
  badge?: 'new';
  icon?: MenuIcon;
  /** Secondary group under the FAQ divider — the design's RESOURCES rail. */
  secondary?: true;
}> = [
  { name: 'home', label: 'Home', url: '/alignment-asset', icon: 'house' },
  { name: 'overview', label: 'Overview', url: '/alignment-asset/overview', icon: 'compass' },
  // Not in the design's rail, so no icon.
  { name: 'incentive-model', label: 'Incentive Model', url: '/alignment-asset/incentive-model' },
  { name: 'activities', label: 'Activities', url: '/alignment-asset/activities', icon: 'lightning' },
  { name: 'profile', label: 'Profile', url: '/alignment-asset/profile', icon: 'user-circle' },
  { name: 'kudos', label: 'Kudos', url: '/alignment-asset/kudos', badge: 'new', icon: 'hands-clapping' },
  // The design calls this "Portfolio & Holdings"; same entry, so it takes that
  // row's chart-pie-slice icon while keeping the current label.
  { name: 'trust-holdings', label: 'Trust & Holdings', url: '/alignment-asset/trust-holdings', icon: 'chart-pie-slice' },
  { name: 'leaderboard', label: 'Leaderboard', url: '/alignment-asset/leaderboard', icon: 'ranking' },
  { name: 'faqs', label: 'FAQ', url: '/alignment-asset/faqs', icon: 'question' },

  /* Everything below sits under the divider in the smaller secondary style. */
  { name: 'product-versions', label: 'Product Versions', url: '/alignment-asset/product-versions', secondary: true },
  { name: 'feedback', label: 'Feedback', url: 'https://forms.gle/NAKxJ8RUqmUf9fmQ9', isExternal: true, secondary: true },
  { name: 'terms-of-use', label: 'Terms of Use', url: '/alignment-asset/terms-of-use', secondary: true },
  { name: 'privacy-policy', label: 'Privacy Policy', url: '/alignment-asset/privacy-policy', secondary: true },
  { name: 'disclosure', label: 'Disclosure', url: '/alignment-asset/disclosure', secondary: true },
];

function PlaaMenu({ activeItem, onMenuItemClick, isLoggedIn }: PlaaMenuProps) {
  const router = useRouter();
  const { onNavMenuClicked } = useAlignmentAssetsAnalytics();

  // Guests (no LabOS session) can't give kudos and shouldn't see the feature
  // exists; a signed-in non-PLAA member can still read the board.
  //
  // Profile is PLAA-members-only, matching the page's own gate, so nobody is
  // offered a link that would turn them away. Hidden while access is unknown.
  const { canView: canViewPlaa } = usePlaaAccess();
  const visibleItems = menuItems.filter((item) => {
    if (item.name === 'kudos') return !!isLoggedIn;
    if (item.name === 'profile') return canViewPlaa;
    return true;
  });

  const onItemClicked = (label: string, url: string, isExternal?: boolean) => {
    onNavMenuClicked(label, url);

    // Call the callback to close mobile menu if provided
    if (onMenuItemClick) {
      onMenuItemClick();
    }

    if (isExternal) {
      // Open external links in a new tab
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    // Check if we're already on the target URL
    const currentPath = window.location.pathname;
    if (currentPath === url) {
      // Already on this page, no need to navigate or show loader
      return;
    }

    if (window.innerWidth < 1024) {
      triggerLoader(true);
    }
    router.push(url);
  };

  return (
    <>
      <nav className="plaa-menu" role="navigation" aria-label="PLAA navigation">
        {/* Navigation Items. The round dropdown was removed here (PLAA-96) —
            round selection now lives only on the Leaderboard page. */}
        <ul className="plaa-menu__list" role="list">
          {visibleItems.map((item, index) => (
            <li key={`plaa-${item.name}`} role="listitem">
              {/* Rule above the first secondary entry, separating the product
                  pages from the resources/legal links. */}
              {item.secondary && !visibleItems[index - 1]?.secondary && <hr className="plaa-menu__divider" />}
              <button
                onClick={() => onItemClicked(item.label, item.url, item.isExternal)}
                className={`plaa-menu__item ${activeItem === item.name ? 'plaa-menu__item--active' : ''} ${
                  item.secondary ? 'plaa-menu__item--secondary' : ''
                }`}
                aria-current={activeItem === item.name ? 'page' : undefined}
              >
                {item.icon &&
                  (() => {
                    const Icon = ICONS[item.icon];
                    return <Icon filled={activeItem === item.name} />;
                  })()}
                <span className="plaa-menu__item-text">{item.label}</span>
                {item.badge === 'new' && <span className="plaa-menu__badge">NEW</span>}
                {item.isExternal && <Image src="/icons/external-link.svg" alt="external link" width={11} height={11} />}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <style jsx>
        {`
          /* =================================================================
             PlaaMenu - Figma Design Tokens
             ================================================================= */

          .plaa-menu {
            padding: 20px 12px;
          }

          /* ---------------------------------------------------------------
             Round Selector Container
             --------------------------------------------------------------- */
          .plaa-menu__selector {
            margin-bottom: 8px;
          }

          /* ---------------------------------------------------------------
             Navigation List
             Figma: gap 8px between items
             --------------------------------------------------------------- */
          .plaa-menu__list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            list-style: none;
            margin: 0;
            padding: 0;
          }

          /* ---------------------------------------------------------------
             Menu Item
             Updated: 176x35px (200px sidebar - 24px padding), padding 8px, radius 4px
             --------------------------------------------------------------- */
          .plaa-menu__item {
            width: 176px;
            height: 35px;
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px;
            background-color: #ffffff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            text-align: left;
            transition: background-color 0.15s ease;
          }

          .plaa-menu__item:hover {
            background-color: #f8fafc;
          }

          /* ---------------------------------------------------------------
             Divider + secondary group (resources / legal)
             --------------------------------------------------------------- */
          .plaa-menu__divider {
            border: none;
            border-top: 1px solid var(--plaa-border-light, #e2e8f0);
            margin: 8px 8px 10px;
          }

          .plaa-menu__item--secondary {
            height: 30px;
          }

          .plaa-menu__item--secondary .plaa-menu__item-text {
            font-size: 11px;
            color: #64748b;
          }

          /* ---------------------------------------------------------------
             Menu Item - Active State
             Figma: background #f1f5f9, text #0b4f66
             --------------------------------------------------------------- */
          .plaa-menu__item--active {
            /* PLAA-96: brand-subtle background plus a 3px brand left bar. */
            background-color: #e6f1f5;
            box-shadow: inset 3px 0 0 0 #0b4f66;
          }

          .plaa-menu__item--active .plaa-menu__item-text {
            color: #0b4f66;
          }

          /* Icons inherit the row colour, so the active row tints them too. */
          .plaa-menu__item :global(svg) {
            flex: none;
            color: #475569;
          }

          .plaa-menu__item--active :global(svg) {
            color: #0b4f66;
          }

          /* ---------------------------------------------------------------
             Menu Item Text
             Figma: Inter Medium, 12px, #475569
             --------------------------------------------------------------- */
          .plaa-menu__item-text {
            font-size: 12px;
            font-weight: 500;
            color: #475569;
            line-height: normal;
            font-family: 'Inter', sans-serif;
          }

          /* ---------------------------------------------------------------
             "NEW" pill — marks a newly launched nav entry (Kudos)
             --------------------------------------------------------------- */
          .plaa-menu__badge {
            margin-left: auto;
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.04em;
            color: #0b4f66;
            background: #e6f1f5;
            border-radius: 4px;
            padding: 2px 5px;
            line-height: 1;
            font-family: 'Inter', sans-serif;
          }

          @media (max-width: 768px) {
            .plaa-menu {
              padding: 16px;
            }

            .plaa-menu__item {
              width: 93%;
            }
          }
        `}
      </style>
    </>
  );
}

export default PlaaMenu;
