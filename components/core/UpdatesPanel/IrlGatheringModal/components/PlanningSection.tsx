'use client';

import s from '../IrlGatheringModal.module.scss';

interface PlanningSectionProps {
  planningQuestion: string;
}

export function PlanningSection({ planningQuestion }: PlanningSectionProps) {
  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>{planningQuestion}</h3>
      <p className={s.sectionDescription}>Let others know if you are attending.</p>
      <div className={s.datePickerSection}>
        <span className={s.datePickerLabel}>Select date range</span>
        <div className={s.datePickerInput}>
          <span>Select date range</span>
        </div>
      </div>
    </div>
  );
}

