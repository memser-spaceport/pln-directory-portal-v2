'use client';

import { usePathname } from 'next/navigation';
import PlaaMenu, { PlaaActiveItem } from './plaa-menu';
import PlaaBackButton from './plaa-back-btn';
import PlaaAnnouncementBanner from './plaa-announcement-banner';
import styles from '@/app/alignment-assets/plaa.module.css';

interface PlaaLayoutWrapperProps {
  readonly children: React.ReactNode;
}

// Map pathname to menu active item and page title
const getPageInfo = (pathname: string): { activeItem: PlaaActiveItem; title: string } => {
  const pathSegment = pathname.split('/').pop() || 'overview';
  
  const pageMap: Record<string, { activeItem: PlaaActiveItem; title: string }> = {
    'overview': { activeItem: 'overview', title: 'Overview' },
    'rounds': { activeItem: 'rounds', title: 'Rounds' },
    'incentive-model': { activeItem: 'incentive-model', title: 'Incentive Model' },
    'activities': { activeItem: 'activities', title: 'Activities' },
    'product-versions': { activeItem: 'product-versions', title: 'Product Versions' },
    'faq': { activeItem: 'faq', title: 'FAQ' },
    'terms-of-use': { activeItem: 'terms-of-use', title: 'Terms of Use' },
    'feedback': { activeItem: 'feedback', title: 'Feedback' },
    'privacy-policy': { activeItem: 'privacy-policy', title: 'Privacy Policy' },
  };

  return pageMap[pathSegment] || pageMap['overview'];
};

export default function PlaaLayoutWrapper({ children }: PlaaLayoutWrapperProps) {
  const pathname = usePathname();
  const { activeItem, title } = getPageInfo(pathname);

  return (
    <div className={styles.plaa}>
      {/* Fixed Announcement Banner */}
      <div className={styles.plaa__banner}>
        <PlaaAnnouncementBanner message="Upcoming: Buyback Auction Q1 2026 - date TBA" />
      </div>

      {/* Mobile Back Button (hidden on desktop) */}
      <div className={styles.plaa__backbtn}>
        <PlaaBackButton title={title} />
      </div>

      {/* Main Layout */}
      <div className={styles.plaa__main}>
        {/* Fixed Sidebar */}
        <aside className={styles.plaa__sidebar}>
          <PlaaMenu activeItem={activeItem} />
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