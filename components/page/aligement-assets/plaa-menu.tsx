'use client';

import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChartPieSlice,
  Compass,
  HandsClapping,
  House,
  Lightning,
  Question,
  Ranking,
  UserCircle,
} from '@phosphor-icons/react';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';
import { usePlaaAccess } from '@/services/rbac/hooks/usePlaaAccess';

export type PlaaActiveItem =
  | 'home'
  | 'overview'
  | 'activities'
  | 'leaderboard'
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
  onMenuItemClick?: () => void;
  isLoggedIn?: boolean;
}

const ICONS = {
  house: House,
  compass: Compass,
  lightning: Lightning,
  'user-circle': UserCircle,
  'hands-clapping': HandsClapping,
  'chart-pie-slice': ChartPieSlice,
  ranking: Ranking,
  question: Question,
} as const;

type MenuIcon = keyof typeof ICONS;

const menuItems: Array<{
  name: PlaaActiveItem;
  label: string;
  url: string;
  isExternal?: boolean;
  badge?: 'new';
  icon?: MenuIcon;
  secondary?: true;
}> = [
  { name: 'home', label: 'Home', url: '/alignment-asset', icon: 'house' },
  { name: 'overview', label: 'Overview', url: '/alignment-asset/overview', icon: 'compass' },
  { name: 'activities', label: 'Activities', url: '/alignment-asset/activities', icon: 'lightning' },
  { name: 'profile', label: 'Profile', url: '/alignment-asset/profile', icon: 'user-circle' },
  { name: 'kudos', label: 'Kudos', url: '/alignment-asset/kudos', badge: 'new', icon: 'hands-clapping' },
  {
    name: 'trust-holdings',
    label: 'Portfolio & Holdings',
    url: '/alignment-asset/portfolio-holdings',
    icon: 'chart-pie-slice',
  },
  { name: 'leaderboard', label: 'Leaderboard', url: '/alignment-asset/leaderboard', icon: 'ranking' },
  { name: 'faqs', label: 'FAQ', url: '/alignment-asset/faqs', icon: 'question' },

  { name: 'product-versions', label: 'Product Versions', url: '/alignment-asset/product-versions', secondary: true },
  {
    name: 'feedback',
    label: 'Feedback',
    url: 'https://forms.gle/NAKxJ8RUqmUf9fmQ9',
    isExternal: true,
    secondary: true,
  },
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
        <ul className="plaa-menu__list" role="list">
          {visibleItems.map((item, index) => (
            <li key={`plaa-${item.name}`} role="listitem">
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
                    return <Icon size={16} weight={activeItem === item.name ? 'fill' : 'regular'} aria-hidden />;
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
            background-color: #e6f1f5;
            box-shadow: inset 3px 0 0 0 #0b4f66;
          }

          .plaa-menu__item--active .plaa-menu__item-text {
            color: #0b4f66;
          }

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
