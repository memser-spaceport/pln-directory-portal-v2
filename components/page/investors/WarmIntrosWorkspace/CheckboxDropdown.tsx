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
        className={clsx(s.trigger, open && s.triggerOpen, hasSelection && s.triggerActive, disabled && s.triggerDisabled)}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={s.triggerLabel}>{placeholder}</span>
        {hasSelection && <span className={s.triggerCount}>{value.length}</span>}
        <span className={clsx(s.triggerCaret, open && s.triggerCaretOpen)} aria-hidden>
          <svg height="20" width="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747 3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0 1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502 0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0 0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z" fill="currentColor" />
          </svg>
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
