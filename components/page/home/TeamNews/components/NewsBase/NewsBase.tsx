import { PropsWithChildren, ReactNode } from 'react';

import s from './NewsBase.module.scss';

interface Props {
  headerDetails?: ReactNode;
}

export function NewsBase(props: PropsWithChildren<Props>) {
  const { children, headerDetails } = props;

  return (
    <section className={s.section}>
      <div className={s.header}>
        <h2 className={s.title}>Network updates</h2>
        {headerDetails}
      </div>
      <p className={s.sub}>Recent shipping, raises, partnerships, and milestones from across the network.</p>
      {children}
    </section>
  );
}
