import React from 'react';
import s from './loading.module.scss';

export default function Loading() {
  return (
    <div className={s.root}>
      <div className={s.breadcrumb} />
      <div className={s.title} />
      <div className={s.meta} />
      <div className={s.body}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={s.line} style={{ width: `${70 + Math.random() * 30}%` }} />
        ))}
      </div>
    </div>
  );
}
