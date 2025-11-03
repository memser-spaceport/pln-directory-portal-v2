import { clsx } from 'clsx';
import { HTMLAttributes, InputHTMLAttributes } from 'react';

import s from './Input.module.scss';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;

  return (
    <div className={clsx(s.root, className)}>
      <input {...rest} className={s.input} />
    </div>
  );
}
