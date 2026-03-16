import Image from 'next/image';
import s from './DealsEmptyState.module.scss';

interface DealsEmptyStateProps {
  onClearFilters: () => void;
}

export function DealsEmptyState({ onClearFilters }: DealsEmptyStateProps) {
  return (
    <div className={s.root}>
      <div className={s.container}>
        <div className={s.illustration}>
          <Image src="/images/deals-empty.svg" alt="" width={170} height={114} priority />
        </div>
        <div className={s.content}>
          <h3 className={s.title}>No deals match these filters</h3>
          <button type="button" className={s.clearButton} onClick={onClearFilters}>
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}
