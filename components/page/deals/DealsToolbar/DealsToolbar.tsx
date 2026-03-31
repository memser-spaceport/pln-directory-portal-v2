'use client';

import { DEAL_SORT_OPTIONS } from '@/services/deals/constants';
import { useSubmitDealModalStore, useRequestDealModalStore } from '@/services/deals/store';
import { useDealsAnalytics } from '@/analytics/deals.analytics';
import { SortDropdown } from '@/components/common/filters/SortDropdown';
import s from './DealsToolbar.module.scss';

interface DealsToolbarProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
}

export function DealsToolbar({ currentSort, onSortChange }: DealsToolbarProps) {
  const { openModal: openSubmitModal } = useSubmitDealModalStore((state) => state.actions);
  const { actions: requestDealActions } = useRequestDealModalStore();
  const { trackSubmitModalOpened, trackRequestModalOpened } = useDealsAnalytics();

  const handleSubmitClick = () => {
    trackSubmitModalOpened();
    openSubmitModal();
  };

  const handleRequestDealClick = () => {
    trackRequestModalOpened();
    requestDealActions.openModal();
  };

  return (
    <div className={s.toolbar}>
      <div className={s.titleRow}>
        <div className={s.titleSection}>
          <h1 className={s.title}>Deals</h1>
          <div className={s.subtitleRow}>
            <p className={s.subtitle}>Exclusive deals for Protocol Labs founders.</p>
            <button type="button" className={s.requestLink} onClick={handleRequestDealClick}>
              Missing a deal? Request one
              <svg className={s.requestLinkIcon} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4.167 10h11.666M10.833 5l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
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
