import { PropsWithChildren, ReactNode } from 'react';

import s from './FormLabel.module.scss';

interface Props {
  label: ReactNode;
  error?: ReactNode;
}

export function FormLabel(props: PropsWithChildren<Props>) {
  const { label, error, children } = props;

  return (
    <div className={s.root}>
      <div className={s.label}>{label}</div>
      {children}
      {error}
    </div>
  );
}
