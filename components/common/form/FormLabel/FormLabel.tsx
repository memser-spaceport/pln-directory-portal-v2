import { PropsWithChildren, ReactNode } from 'react';

import s from './FormLabel.module.scss';

export interface FormLabelProps {
  label: ReactNode;
  error?: ReactNode;
}

export function FormLabel(props: PropsWithChildren<FormLabelProps>) {
  const { label, error, children } = props;

  return (
    <div className={s.root}>
      <div className={s.label}>{label}</div>
      {children}
      {error && <div className={s.error}>{error}</div>}
    </div>
  );
}
