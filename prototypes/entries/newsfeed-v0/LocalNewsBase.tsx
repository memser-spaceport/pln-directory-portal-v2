import { PropsWithChildren, ReactNode } from 'react';

// Copy of the production NewsBase, reusing its SCSS 1:1 — the only change is the
// hardcoded section title ("Network Updates" instead of "News from the network").
import s from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';

interface Props {
  headerDetails?: ReactNode;
}

export function LocalNewsBase({ children, headerDetails }: PropsWithChildren<Props>) {
  return (
    <section className={s.section}>
      <div className={s.header}>
        <h2 className={s.title}>Network Updates</h2>
        {headerDetails}
      </div>
      <p className={s.sub}>Recent shipping, raises, partnerships, and milestones from across the network.</p>
      {children}
    </section>
  );
}
