'use client';

import { useQueryStates } from 'nuqs';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { gantryDashboardParsers } from '@/app/gantry/dashboard/searchParams';
import { GantryItemDetailContent } from '../shared/GantryItemDetailContent';
import s from '../GantryDetailPage.module.scss';

export function GantryItemDrawer() {
  const [params, setParams] = useQueryStates(gantryDashboardParsers, {
    history: 'push',
    shallow: true,
  });
  const itemId = params.itemId || null;

  const onClose = () => {
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
