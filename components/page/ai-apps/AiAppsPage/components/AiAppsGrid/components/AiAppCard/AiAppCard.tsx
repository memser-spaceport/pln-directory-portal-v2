'use client';
import Link from 'next/link';

import { AiApp } from '@/services/ai-apps/ai-apps.service';

import s from './AiAppCard.module.scss';

interface Props {
  app: AiApp;
}

export function AiAppCard({ app }: Props) {
  return (
    <Link href={`/pl-infra/ai-apps/${app.uid}`} className={s.root}>
      <h3 className={s.name}>{app.name}</h3>
      <p className={s.description}>{app.description}</p>
      <div className={s.meta}>
        <span className={s.metaItem}>
          <span className={s.metaLabel}>Created by</span>
          <span className={s.metaValue}>{app.member.name}</span>
        </span>
        <span className={s.metaItem}>
          <span className={s.metaLabel}>Deployed</span>
          <span className={s.metaValue}>{new Date(app.createdAt).toLocaleDateString()}</span>
        </span>
      </div>
    </Link>
  );
}
