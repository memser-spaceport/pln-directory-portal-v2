import { FC, PropsWithChildren, ReactNode } from 'react';

import s from './FormField.module.css';
import { FormFieldError } from '@/components/form/form-field-error';

interface Props extends PropsWithChildren {
  label?: string;
  name?: string;
  footerComponent?: ReactNode;
}

// DEPRECATED
export const FormField: FC<Props> = ({ name, children, footerComponent, label }) => {
  return (
    <div className={s.root}>
      {label && <div className={s.label}>{label}</div>}
      {children}
      <div className={s.footer}>
        <div>{name && <FormFieldError name={name} />}</div>
        {footerComponent}
      </div>
    </div>
  );
};
