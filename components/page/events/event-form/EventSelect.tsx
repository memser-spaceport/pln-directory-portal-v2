import clsx from 'clsx';
import type { SelectHTMLAttributes } from 'react';

import { ChevronDownIcon } from '@/components/icons';

import s from './EventSelect.module.scss';

export interface EventSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'> {
  value: string;
  options: EventSelectOption[];
  onChange: (value: string) => void;
  /** Shown, as an empty choice, while nothing is picked. */
  placeholder?: string;
  invalid?: boolean;
}

/** A native select that holds a plain string: the time lists and the social platform. */
export function EventSelect({ value, options, onChange, placeholder, invalid, className, ...rest }: Props) {
  return (
    <span className={clsx(s.root, className)}>
      <select
        {...rest}
        className={clsx(s.select, invalid && s.invalid, !value && s.empty)}
        value={value}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange(event.target.value)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className={s.caret} aria-hidden />
    </span>
  );
}
