'use client';

import React from 'react';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import s from './PitchEventHeader.module.scss';

type Status = 'DRAFT' | 'OPEN' | 'CLOSED';

const BADGE_CONFIG: Record<Status, { badgeClass: string; dotClass: string; label: string }> = {
  DRAFT: { badgeClass: s.badgeDraft, dotClass: s.dotDraft, label: 'Draft' },
  OPEN: { badgeClass: s.badgeActive, dotClass: s.dotActive, label: 'Spotlight Active' },
  CLOSED: { badgeClass: s.badgeCompleted, dotClass: s.dotCompleted, label: 'Completed' },
};

type Props = {
  title: string;
  description: string;
  status: Status;
};

export const PitchEventHeader = ({ title, description, status }: Props) => {
  const badge = BADGE_CONFIG[status];

  return (
    <div className={s.card}>
      <div className={s.headline}>
        <div className={s.headlineText}>
          {status !== 'OPEN' && (
            <div className={badge.badgeClass}>
              <span className={badge.dotClass} aria-hidden />
              <span className={s.badgeLabel}>{badge.label}</span>
            </div>
          )}
          <h1 className={s.title}>{title}</h1>
          {description && <p className={s.description} dangerouslySetInnerHTML={{ __html: description }} />}
        </div>
      </div>
      <Alert>
        <p>
          Confidentiality notice: Materials presented here are confidential and are provided exclusively for your
          review. DO NOT copy, screenshot, share, or distribute to others. Any unauthorized disclosure will result in
          removal from the network.
        </p>
      </Alert>
    </div>
  );
};
