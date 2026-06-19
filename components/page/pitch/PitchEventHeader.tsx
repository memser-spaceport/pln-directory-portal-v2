'use client';

import React from 'react';
import { Alert } from '@/components/page/demo-day/shared/Alert';
import s from './PitchEventHeader.module.scss';

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
