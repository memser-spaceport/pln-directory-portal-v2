'use client';

import s from './DraftSaveStatus.module.scss';

interface Props {
  readonly status: 'idle' | 'saving' | 'saved';
}

export function DraftSaveStatus({ status }: Props) {
  if (status === 'idle') return null;

  return (
    <span className={status === 'saving' ? s.saving : s.saved}>
      {status === 'saved' && (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M2 5l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === 'saving' ? 'Saving…' : 'Saved'}
    </span>
  );
}
