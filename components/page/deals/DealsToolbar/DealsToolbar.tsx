'use client';

import { DEAL_SORT_OPTIONS } from '@/services/deals/constants';
import { useSubmitDealModalStore } from '@/services/deals/store';
import { useDealsAnalytics } from '@/analytics/deals.analytics';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import s from './DealsToolbar.module.scss';

interface DealsToolbarProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
}

export function DealsToolbar({ currentSort, onSortChange }: DealsToolbarProps) {
  const { openModal } = useSubmitDealModalStore((state) => state.actions);
  const { trackSubmitModalOpened } = useDealsAnalytics();

  const handleSubmitClick = () => {
    trackSubmitModalOpened();
    openModal();
  };

  return (
    <div className={s.toolbar}>
      <div className={s.titleRow}>
        <div className={s.titleSection}>
          <h1 className={s.title}>Deals</h1>
          <p className={s.subtitle}>Exclusive deals for Protocol Labs founders.</p>
        </div>
        <div className={s.actions}>
          <SortDropdown
            options={DEAL_SORT_OPTIONS}
            currentSort={currentSort}
            onSortChange={onSortChange}
            className={s.sortDropdown}
          />
          <button type="button" className={s.submitButton} onClick={handleSubmitClick}>
            <svg className={s.submitIcon} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 3.75V14.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.75 9H14.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            List your Product
          </button>
        </div>
      </div>
    </div>
  );
}
