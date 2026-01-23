'use client';

import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PlaaRoundSelector from './plaa-round-selector';
import { useAlignmentAssetsAnalytics } from '@/analytics/alignment-assets.analytics';

/* ==========================================================================
   PlaaMenu Component
   Pixel-perfect implementation based on Figma design
   Figma: https://www.figma.com/design/xrvyUEqgZ0oRNT0spUruMW/Untitled?node-id=1-5250
   ========================================================================== */

export type PlaaActiveItem = 'overview' | 'activities' | 'incentive-model' | 'terms-of-use' | 'privacy-policy' | 'product-versions' | 'faqs' | 'disclosure' | 'feedback';

interface PlaaMenuProps {
  activeItem?: PlaaActiveItem;
  currentRound?: number;
  totalRounds?: number;
  viewingRound?: number; // The round being viewed on the current page
  onMenuItemClick?: () => void; // Callback to handle menu item clicks (e.g., close mobile menu)
}

const menuItems: Array<{ name: PlaaActiveItem; label: string; url: string; isExternal?: boolean }> = [
  { name: 'overview', label: 'Overview', url: '/alignment-asset/overview' },
  { name: 'incentive-model', label: 'Incentive Model', url: '/alignment-asset/incentive-model' },
  { name: 'activities', label: 'Activities', url: '/alignment-asset/activities' },
  { name: 'product-versions', label: 'Product Versions', url: '/alignment-asset/product-versions' },
  { name: 'faqs', label: 'FAQ', url: '/alignment-asset/faqs' },
  { name: 'feedback', label: 'Feedback', url: 'https://forms.gle/NAKxJ8RUqmUf9fmQ9', isExternal: true },
  { name: 'terms-of-use', label: 'Terms of Use', url: '/alignment-asset/terms-of-use' },
  { name: 'privacy-policy', label: 'Privacy Policy', url: '/alignment-asset/privacy-policy' },
  { name: 'disclosure', label: 'Disclosure', url: '/alignment-asset/disclosure' }
];

function PlaaMenu({ activeItem, currentRound = 1, totalRounds = 12, viewingRound, onMenuItemClick }: PlaaMenuProps) {
  const router = useRouter();
  const { onNavMenuClicked } = useAlignmentAssetsAnalytics();

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
        {/* Round Selector - Commented out for now */}
        <div className="plaa-menu__selector">
          <PlaaRoundSelector
            currentRound={currentRound}
            totalRounds={totalRounds}
            viewingRound={viewingRound}
            onRoundNavigation={onMenuItemClick}
          />
        </div>

        {/* Navigation Items */}
        <ul className="plaa-menu__list" role="list">
          {menuItems.map((item) => (
            <li key={`plaa-${item.name}`} role="listitem">
              <button
                onClick={() => onItemClicked(item.label, item.url, item.isExternal)}
                className={`plaa-menu__item ${activeItem === item.name ? 'plaa-menu__item--active' : ''}`}
                aria-current={activeItem === item.name ? 'page' : undefined}
              >
                <span className="plaa-menu__item-text">{item.label}</span>
                {item.isExternal && (
                  <Image
                    src="/icons/external-link.svg"
                    alt="external link"
                    width={11}
                    height={11}
                  />
                )}
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
             Menu Item - Active State
             Figma: background #f1f5f9, text #156ff7
             --------------------------------------------------------------- */
          .plaa-menu__item--active {
            background-color: #f1f5f9;
          }

          .plaa-menu__item--active .plaa-menu__item-text {
            color: #156ff7;
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