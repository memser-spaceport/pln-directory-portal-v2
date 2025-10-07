import React, { PropsWithChildren, ReactNode } from 'react';

import s from './Section.module.scss';

interface Props {
  header: ReactNode;
  delimiter?: boolean;
}

export function Section(props: PropsWithChildren<Props>) {
  const { header, children, delimiter = true } = props;

  return (
    <>
      <div className={s.header}>{header}</div>
      {children}
      {delimiter && <div className={s.delimiter} />}
    </>
  );
}
