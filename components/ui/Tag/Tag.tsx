import clsx from 'clsx';
import { CSSProperties, ReactNode, SyntheticEvent } from 'react';

import s from './Tag.module.scss';

interface TagProps {
  disabled?: boolean;
  callback?: (key: string, value: string, selected: boolean, from?: string) => void;
  selected?: boolean;
  value: string;
  variant?: 'default' | 'secondary' | 'primary';
  tagsLength?: number;
  keyValue?: string;
  from?: string;
  icon?: ReactNode;
  color?: string;
  className?: string;
}

export function Tag(props: Readonly<TagProps>) {
  const {
    icon,
    callback,
    className,
    value = '',
    from = '',
    keyValue = '',
    tagsLength = 3,
    selected = false,
    disabled = false,
    color = '#f1f5f9',
    variant = 'default',
  } = props;

  const onTagClickHandler = (event: SyntheticEvent) => {
    if (callback) {
      callback(keyValue, value, selected, from);
      return;
    }
    event.preventDefault();
  };

  const rootClass = clsx(s.root, className, {
    [s.md]: tagsLength < 3,
    [s.default]: variant === 'default',
    [s.primary]: variant === 'primary',
    [s.secondary]: variant === 'secondary' && !selected && !disabled,
    [s.active]: selected && variant === 'secondary',
    [s.inactive]: disabled && variant === 'secondary',
  });

  const style =
    (variant === 'default' || variant === 'primary') && color ? ({ '--tag-color': color } as CSSProperties) : undefined;

  return (
    <button
      tabIndex={-1}
      disabled={disabled}
      className={rootClass}
      style={style}
      data-testid={`ui-tag-${value}`}
      onClick={callback && onTagClickHandler}
    >
      {icon ? <div className={s.icon}>{icon}</div> : null}
      <span className={s.value}>{value}</span>
    </button>
  );
}
