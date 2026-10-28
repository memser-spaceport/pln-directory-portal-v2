'use client';

import React from 'react';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import s from './PitchEventHeader.module.scss';
import { SafeHtml } from '@/components/ui/SafeHtml';

type Props = {
  title: string;
  description: string;
  status?: 'DRAFT' | 'CLOSED';
};

export const PitchEventHeader = ({ title, description, status }: Props) => {
  return (
    <div className={s.card}>
      <div className={s.headline}>
        <div className={s.headlineText}>
          {status === 'DRAFT' && <p className={s.prepLabel}>[Draft]</p>}
          {status === 'CLOSED' && <p className={s.prepLabel}>[Closed]</p>}
          <h1 className={s.title}>{title}</h1>
          {description && (
            <SafeHtml
              as="p"
              className={s.description}
              // Quill stores spaces as &nbsp;, which prevents wrapping and overflows the card.
              html={description.replace(/&nbsp;|&#0*160;|&#x0*a0;|\u00A0/gi, ' ')}
            />
          )}
        </div>
      </div>
      <Alert>
        <p>
          Confidentiality notice: Materials presented here are confidential. DO NOT copy, screenshot, share, or
          distribute to others.
        </p>
      </Alert>
    </div>
  );
};
