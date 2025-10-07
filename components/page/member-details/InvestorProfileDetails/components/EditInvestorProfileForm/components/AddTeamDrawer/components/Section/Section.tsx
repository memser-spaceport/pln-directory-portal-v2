import React, { PropsWithChildren, ReactNode } from 'react';

import s from './Section.module.scss';

interface Props {
  header: ReactNode;
}

export function Section(props: PropsWithChildren<Props>) {
  const { header, children } = props;

  return (
    <>
      <div className={s.header}>{header}</div>
      {children}
      <div className={s.delimiter} />
    </>
  );
}
