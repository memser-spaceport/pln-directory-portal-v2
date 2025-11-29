import clsx from 'clsx';
import { HTMLAttributes } from 'react';

import s from './Button.module.scss';

// Full design system for button can be found here
// https://www.figma.com/design/ajJidFJgQCsS9nzXbq6upe/Design-System-%7C-Protocol-Labs?node-id=13053-5792&m=dev

interface Props extends Omit<HTMLAttributes<HTMLButtonElement>, 'style'> {
  style?: 'fill' | 'border' | 'link';
  variant?: 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'light';
  size?: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';
  underline?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button(props: Props) {
  const { size = 'm', style = 'fill', variant = 'primary', underline = false, children, className, ...rest } = props;

  const styleClass = clsx({
    [s.fill]: style === 'fill',
    [s.border]: style === 'border',
    [s.link]: style === 'link',
  });

  const variantClass = clsx({
    [s.primary]: variant === 'primary',
    [s.secondary]: variant === 'secondary',
    [s.error]: variant === 'error',
    [s.success]: variant === 'success',
    [s.warning]: variant === 'warning',
    [s.light]: variant === 'light',
  });

  const sizeClass = clsx({
    [s.xxs]: size === 'xxs',
    [s.xs]: size === 'xs',
    [s.small]: size === 's',
    [s.medium]: size === 'm',
    [s.large]: size === 'l',
    [s.xl]: size === 'xl',
    [s.xxl]: size === 'xxl',
  });

  const underlineClass = clsx({
    [s.underline]: underline && style === 'link',
  });

  const rootClass = clsx(s.root, sizeClass, styleClass, variantClass, underlineClass, className);

  return (
    <button {...rest} className={rootClass}>
      {children}
    </button>
  );
}
