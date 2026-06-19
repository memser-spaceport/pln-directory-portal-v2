'use client';

import React from 'react';
import s from './PitchEventHeader.module.scss';

type Status = 'DRAFT' | 'CLOSED';

const BADGE_CONFIG: Record<Status, { badgeClass: string; dotClass: string; label: string }> = {
  DRAFT: { badgeClass: s.badgeDraft, dotClass: s.dotDraft, label: 'Draft' },
  CLOSED: { badgeClass: s.badgeCompleted, dotClass: s.dotCompleted, label: 'Completed' },
};

type Props = {
  status: Status;
};

export const PitchStatusBadge = ({ status }: Props) => {
  const badge = BADGE_CONFIG[status];

  return (
    <div className={badge.badgeClass}>
      <span className={badge.dotClass} aria-hidden />
      <span className={s.badgeLabel}>{badge.label}</span>
    </div>
  );
};
