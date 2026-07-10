'use client';

import { useEffect, useRef } from 'react';
import { useQueryStates } from 'nuqs';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { gantryDashboardParsers } from '@/app/gantry/dashboard/searchParams';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { GantryItemDetailContent } from '../shared/GantryItemDetailContent';
import s from '../GantryDetailPage.module.scss';

export function GantryItemDrawer() {
  const analytics = useGantryAnalytics();
  const openedAtRef = useRef<number | null>(null);
  const trackedItemIdRef = useRef<string | null>(null);

  const [params, setParams] = useQueryStates(gantryDashboardParsers, {
    history: 'push',
    shallow: true,
  });
  const itemId = params.itemId || null;

  useEffect(() => {
    if (!itemId || trackedItemIdRef.current === itemId) return;
    trackedItemIdRef.current = itemId;
    openedAtRef.current = Date.now();
    analytics.onItemDrawerOpened(itemId);
  }, [itemId, analytics]);

  const onClose = () => {
    if (itemId && openedAtRef.current !== null) {
      analytics.onItemDrawerClosed(itemId, Date.now() - openedAtRef.current);
    }
    openedAtRef.current = null;
    trackedItemIdRef.current = null;
    void setParams({ itemId: null }, { history: 'replace' });
  };

  return (
    <Drawer isOpen={!!itemId} onClose={onClose} width={900}>
      {itemId && (
        <GantryItemDetailContent
          key={itemId}
          uid={itemId}
          variant="drawer"
          onDismiss={onClose}
          headerStart={
            <div className={s.drawerToolbar}>
              <button type="button" className={s.drawerBackBtn} onClick={onClose} aria-label="Back">
                ← Back
              </button>
            </div>
          }
        />
      )}
    </Drawer>
  );
}
