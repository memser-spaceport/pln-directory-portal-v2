'use client';

import { useRef, useState } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import clsx from 'clsx';
import s from './CheckboxDropdown.module.scss';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
  'aria-label'?: string;
  disabled?: boolean;
}

export function CheckboxDropdown({ options, value, onChange, placeholder, 'aria-label': ariaLabel, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside([ref], () => setOpen(false));

  const toggle = (v: string) => {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  };

  const hasSelection = value.length > 0;

  return (
    <div className={s.wrap} ref={ref}>
      <button
        type="button"
        className={clsx(s.trigger, hasSelection && s.triggerActive, disabled && s.triggerDisabled)}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={s.triggerLabel}>{placeholder}</span>
        {hasSelection && <span className={s.triggerCount}>{value.length}</span>}
        <span className={s.triggerCaret} aria-hidden>
          {open ? '▴' : '▾'}
        </span>
      </button>

      {open && (
        <div className={s.menu} role="listbox" aria-multiselectable="true" aria-label={ariaLabel}>
          {options.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <label key={opt.value} className={clsx(s.item, checked && s.itemChecked)}>
                <input
                  type="checkbox"
                  className={s.checkbox}
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                />
                <span className={s.itemLabel}>{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
