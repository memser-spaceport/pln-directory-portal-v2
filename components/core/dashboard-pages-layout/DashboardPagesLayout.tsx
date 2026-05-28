import { ReactNode } from 'react';
import clsx from 'clsx';

import s from './DashboardPagesLayout.module.css';

export default function DashboardPagesLayout({ filters, content }: { filters: ReactNode; content: ReactNode }) {
  return (
    <section className={s.root}>
      <aside className={s.filters}>{filters}</aside>
      <main className={s.content}>{content}</main>
    </section>
  );
}
