import { clsx } from 'clsx';
import React, { PropsWithChildren, ReactNode } from 'react';

import s from './MemberDetailsSectionHeader.module.scss';

interface Props {
  title: ReactNode;
  className?: string;
}

export function MemberDetailsSectionHeader(props: PropsWithChildren<Props>) {
  const { title, children, className } = props;

  return (
    <div className={clsx(s.root, className)}>
      <h2 className={s.title}>{title}</h2>
      {children}
    </div>
  );
}
