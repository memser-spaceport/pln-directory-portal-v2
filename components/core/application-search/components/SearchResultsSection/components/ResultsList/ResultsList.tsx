import React, { PropsWithChildren } from 'react';

import s from './ResultsList.module.scss';

interface Props {
  title?: string;
  itemsCount: number;
}

export function ResultsList(props: PropsWithChildren<Props>) {
  const { title, itemsCount, children } = props;

  return (
    <>
      <div className={s.root}>
        {title && (
          <div className={s.label}>
            {title} ({itemsCount})
          </div>
        )}
        {children}
      </div>
      <div className={s.divider} />
    </>
  );
}
