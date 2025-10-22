import { PropsWithChildren } from 'react';

import s from './Label.module.scss';

interface Props {
  mandatory?: boolean;
}

export function Label(props: PropsWithChildren<Props>) {
  const { children, mandatory = false } = props;

  return (
    <div className={s.root}>
      {children}
      {mandatory && <span className={s.mandatory}>*</span>}
    </div>
  );
}
