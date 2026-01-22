'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import PlaaMenu, { PlaaActiveItem } from './plaa-menu';
import PlaaBackButton from './plaa-back-btn';
import { PlaaBanner } from '@/components/core/navbar/components/PlaaBanner';
import styles from '@/app/alignment-asset/plaa.module.css';

interface PlaaLayoutWrapperProps {
  readonly children: React.ReactNode;
}

// Map pathname to menu active item, page title, and optional viewing round
const getPageInfo = (pathname: string): { activeItem: PlaaActiveItem | undefined; title: string; viewingRound?: number } => {
  const segments = pathname.split('/').filter(Boolean);
  const pathSegment = segments[segments.length - 1] || 'overview';
  
  // Check if viewing a specific round (e.g., /alignment-asset/rounds/2)
  if (segments.includes('rounds') && segments.length > 2) {
    const roundNumber = parseInt(pathSegment, 10);
    if (!isNaN(roundNumber)) {
      // Viewing a specific round - don't highlight any menu item
      return { activeItem: undefined, title: `Round ${roundNumber}`, viewingRound: roundNumber };
    }
  }
  
  // Check if on main alignment-asset page (current round) or /alignment-asset/rounds (legacy)
  if (pathSegment === 'alignment-asset' || pathSegment === 'rounds') {
    return { activeItem: undefined, title: 'Rounds', viewingRound: undefined };
  }
  
  const pageMap: Record<string, { activeItem: PlaaActiveItem; title: string }> = {
    'overview': { activeItem: 'overview', title: 'Overview' },
    'activities': { activeItem: 'activities', title: 'Activities' },
    'incentive-model': { activeItem: 'incentive-model', title: 'Incentive Model' },
    'terms-of-use': { activeItem: 'terms-of-use', title: 'Terms of Use' },
    'privacy-policy': { activeItem: 'privacy-policy', title: 'Privacy Policy' },
    'product-versions': { activeItem: 'product-versions', title: 'Product Versions' },
    'faqs': { activeItem: 'faqs', title: 'FAQ' },
    'disclosure': { activeItem: 'disclosure', title: 'Disclosure' },
  };

  return pageMap[pathSegment] || pageMap['overview'];
};

export default function PlaaLayoutWrapper({ children }: PlaaLayoutWrapperProps) {
  const pathname = usePathname();
  const { activeItem, title, viewingRound } = getPageInfo(pathname ?? '');

  // Scroll to top when pathname changes (tab switch)
  useEffect(() => {
    // Don't scroll to top if there's a hash in the URL
    if (window.location.hash) {
      return;
    }
    // Scroll both window and document to ensure it works across browsers
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);

  return (
    <div className={styles.plaa}>
      {/* Mobile Back Button (hidden on desktop) */}
      <div className={styles.plaa__backbtn}>
        <PlaaBackButton title={title} />
      </div>

      {/* Mobile Banner - positioned inside layout, hidden on desktop */}
      <div className={styles['plaa__mobile-banner']}>
        <PlaaBanner variant="mobile" />
      </div>

      {/* Main Layout */}
      <div className={styles.plaa__main}>
        {/* Fixed Sidebar */}
        <aside className={styles.plaa__sidebar}>
          <PlaaMenu activeItem={activeItem} totalRounds={12} currentRound={12} viewingRound={viewingRound} />
        </aside>

        {/* Scrollable Content */}
        <div className={styles.plaa__content}>
          <div className={styles['plaa__content-inner']}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
