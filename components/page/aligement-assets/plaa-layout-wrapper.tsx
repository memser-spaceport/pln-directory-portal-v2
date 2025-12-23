'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import PlaaMenu, { PlaaActiveItem } from './plaa-menu';
import PlaaBackButton from './plaa-back-btn';
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
  };

  return pageMap[pathSegment] || pageMap['overview'];
};

export default function PlaaLayoutWrapper({ children }: PlaaLayoutWrapperProps) {
  const pathname = usePathname();
  const { activeItem, title } = getPageInfo(pathname);

  // Scroll to top when pathname changes (tab switch)
  useEffect(() => {
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