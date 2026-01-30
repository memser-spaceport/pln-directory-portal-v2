'use client';

import React from 'react';
import { EmptyIllustration } from '@/components/page/member-details/ForumActivity/components/NoForumActivity/components/EmptyIllustration';
import s from './EmptyState.module.scss';

interface EmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <div className={`${s.emptyState} ${className || ''}`}>
      <div className={s.content}>
        <div className={s.illustration}>
          <EmptyIllustration />
        </div>
        <h3 className={s.title}>{title}</h3>
        {description && <p className={s.description}>{description}</p>}
      </div>
    </div>
  );
}

