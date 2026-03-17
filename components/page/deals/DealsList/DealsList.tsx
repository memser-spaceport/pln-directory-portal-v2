'use client';

import { IDeal } from '@/types/deals.types';
import { DealCard } from '../DealCard/DealCard';
import s from './DealsList.module.scss';

interface DealsListProps {
  deals: IDeal[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onShowMore: () => void;
}

export function DealsList({ deals, hasMore, isLoadingMore, onShowMore }: DealsListProps) {
  return (
    <div className={s.list}>
      {deals.map((deal) => (
        <div key={deal.uid} className={s.cardWrapper}>
          <DealCard deal={deal} />
        </div>
      ))}
      {hasMore && (
        <button className={s.showMore} onClick={onShowMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading...' : 'Show More'}
        </button>
      )}
    </div>
  );
}
