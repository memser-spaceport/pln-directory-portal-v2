'use client';

import type { ReactNode } from 'react';
import type { MockGantryItem } from '../mocks';
import s from './MockGantryCard.module.scss';

interface Props {
  readonly item: MockGantryItem;
  readonly supportControl: ReactNode;
  readonly adminPreview?: ReactNode;
}

function AuthorInitials({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return <span className={s.avatar}>{initials}</span>;
}

export function MockGantryCard({ item, supportControl, adminPreview }: Props) {
  return (
    <article className={s.card}>
      <div className={s.cardHead}>
        <h3 className={s.cardTitle}>{item.title}</h3>
        <div className={s.supportArea}>{supportControl}</div>
      </div>
      <p className={s.cardDescription}>{item.description}</p>
      <div className={s.meta}>
        <span className={s.author}>
          <AuthorInitials name={item.createdBy.name} />
          <span className={s.authorName}>By {item.createdBy.name}</span>
        </span>
      </div>
      {adminPreview && (
        <div className={s.adminPreview}>
          <span className={s.adminLabel}>Admin view</span>
          {adminPreview}
        </div>
      )}
    </article>
  );
}
