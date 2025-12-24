'use client';

import { triggerLoader } from '@/utils/common.utils';
import { useRouter } from 'next/navigation';

/* ==========================================================================
   PlaaMenu Component
   Pixel-perfect implementation based on Figma design
   Figma: https://www.figma.com/design/xrvyUEqgZ0oRNT0spUruMW/Untitled?node-id=1-5250
   ========================================================================== */

export type PlaaActiveItem = 'overview' | 'rounds' | 'terms-of-use' | 'privacy-policy';

interface PlaaMenuProps {
  activeItem?: PlaaActiveItem;
  currentRound?: number;
  totalRounds?: number;
}

const menuItems: Array<{ name: PlaaActiveItem; label: string; url: string }> = [
  { name: 'rounds', label: 'Current Round', url: '/alignment-assets/rounds' },
  { name: 'overview', label: 'Overview', url: '/alignment-assets/overview' },
  { name: 'terms-of-use', label: 'Terms of Use', url: '/alignment-assets/terms-of-use' },
  { name: 'privacy-policy', label: 'Privacy Policy', url: '/alignment-assets/privacy-policy' },
];

function PlaaMenu({ activeItem, currentRound = 2, totalRounds = 12 }: PlaaMenuProps) {
  const router = useRouter();

  const onItemClicked = (url: string) => {
    if (window.innerWidth < 1024) {
      triggerLoader(true);
    }
    router.push(url);
  };

  const handleRoundChange = (round: number) => {
    // Handle round change - could update URL or state
    console.log('Round changed to:', round);
  };

  return (
    <>
      <nav className="plaa-menu" role="navigation" aria-label="PLAA navigation">
        {/* Round Selector - Commented out for now */}
        {/* <div className="plaa-menu__selector">
          <PlaaRoundSelector
            currentRound={currentRound}
            totalRounds={totalRounds}
            onRoundChange={handleRoundChange}
          />
        </div> */}

        {/* Navigation Items */}
        <ul className="plaa-menu__list" role="list">
          {menuItems.map((item) => {
            const isActive = activeItem === item.name;
            return (
              <li key={`plaa-${item.name}`} role="listitem">
                <button
                  onClick={() => onItemClicked(item.url)}
                  className={`plaa-menu__item ${isActive ? 'plaa-menu__item--active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={`plaa-menu__item-text ${isActive ? 'plaa-menu__item-text--active' : ''}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
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
            gap: 14px;
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
            padding: 8px;
            font-weight: 500;
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

          .plaa-menu__item:focus {
            outline: none;
          }

          /* ---------------------------------------------------------------
             Menu Item - Active State
             Figma: background #f1f5f9, text #156ff7
             --------------------------------------------------------------- */
          .plaa-menu__item--active {
            background-color: #f1f5f9;
          }

          /* ---------------------------------------------------------------
             Menu Item Text
             Figma: Inter Medium, 12px, #475569
             --------------------------------------------------------------- */
          .plaa-menu__item-text {
            font-size: 14px;
            font-weight: 500;
            color: rgba(71, 85, 105, 1);
            line-height: normal;
          }
          
          .plaa-menu__item-text--active {
            color: rgba(15, 23, 42, 1);
          }
        `}
      </style>
    </>
  );
}

export default PlaaMenu;
