import clsx from 'clsx';
import { FC, PropsWithChildren, ReactNode } from 'react';

import { FormFieldError } from '@/components/form/form-field-error';

import s from './FormField.module.css';

interface Props extends PropsWithChildren {
  label?: string;
  name?: string;
  footerComponent?: ReactNode;
  className?: string;
}

// DEPRECATED
export const FormField: FC<Props> = (props) => {
  const { label, name, footerComponent, className, children } = props;

  return (
    <div className={clsx(s.root, className)}>
      {label && <div className={s.label}>{label}</div>}
      {children}
      <div className={s.footer}>
        <div>{name && <FormFieldError name={name} />}</div>
        {footerComponent}
      </div>
    </div>
  );
};
