import { clsx } from 'clsx';
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';

import s from './Input.module.scss';

interface BaseProps {
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  as?: 'input' | 'textarea';
}

type InputElProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'as'> & { as?: 'input' };
type TextareaElProps = BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'as'> & { as: 'textarea' };

export type InputProps = InputElProps | TextareaElProps;

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>((props, ref) => {
  const { startIcon, endIcon, className, as = 'input', ...rest } = props;

  const rootClassName = clsx(s.root, className, {
    [s.textarea]: as === 'textarea',
  });

  return (
    <div className={rootClassName}>
      {startIcon}
      {as === 'textarea' ? (
        <textarea {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)} className={s.input} ref={ref as any} />
      ) : (
        <input {...(rest as InputHTMLAttributes<HTMLInputElement>)} className={s.input} ref={ref as any} />
      )}
      {endIcon}
    </div>
  );
});

Input.displayName = 'Input';
