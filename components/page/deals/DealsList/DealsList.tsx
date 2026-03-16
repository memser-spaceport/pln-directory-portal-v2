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
        <DealCard key={deal.id} deal={deal} />
      ))}
      {hasMore && (
        <button className={s.showMore} onClick={onShowMore} disabled={isLoadingMore}>
          {isLoadingMore ? 'Loading...' : 'Show More'}
        </button>
      )}
    </div>
  );
}
