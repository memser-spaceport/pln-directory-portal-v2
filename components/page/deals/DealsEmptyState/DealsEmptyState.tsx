import Image from 'next/image';
import s from './DealsEmptyState.module.scss';

interface DealsEmptyStateProps {
  onClearFilters: () => void;
  hasFilters: boolean;
}

export function DealsEmptyState({ onClearFilters, hasFilters }: DealsEmptyStateProps) {
  return (
    <div className={s.root}>
      <div className={s.container}>
        <div className={s.illustration}>
          <Image src="/images/deals-empty.svg" alt="" width={170} height={114} priority />
        </div>
        <div className={s.content}>
          <h3 className={s.title}>{hasFilters ? 'No deals match these filters' : 'No deals available yet'}</h3>
          {!hasFilters && (
            <p className={s.description}>
              Deals from the Protocol Labs ecosystem will appear here once they are added.
            </p>
          )}
          {hasFilters && (
            <button type="button" className={s.clearButton} onClick={onClearFilters}>
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
