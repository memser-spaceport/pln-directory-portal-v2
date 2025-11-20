import { clsx } from 'clsx';
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

import s from './Input.module.scss';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { startIcon, endIcon, className, ...rest } = props;

  return (
    <div className={clsx(s.root, className)}>
      {startIcon}
      <input {...rest} className={s.input} ref={ref} />
      {endIcon}
    </div>
  );
});

Input.displayName = 'Input';
