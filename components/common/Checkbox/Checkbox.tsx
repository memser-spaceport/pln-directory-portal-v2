import clsx from 'clsx';
import React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';

import { CheckIcon, MinusIcon } from '@/components/icons';

import s from './Checkbox.module.scss';

interface Props {
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  classes?: {
    root?: string;
    indicator?: string;
  };
  /** The checkbox's accessible name, when no `<label>` wraps it (LAB-3095). */
  'aria-label'?: string;
  /** Id of the element that names the checkbox, such as its visible label (LAB-3095). */
  'aria-labelledby'?: string;
}

export function Checkbox(props: Props) {
  const { checked, disabled, classes, onChange, indeterminate } = props;
  const { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy } = props;

  return (
    <BaseCheckbox.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={onChange}
      indeterminate={indeterminate}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={clsx(s.root, classes?.root, {
        [s.checked]: checked,
        [s.indeterminate]: indeterminate,
      })}
    >
      {(checked || indeterminate) && (
        <BaseCheckbox.Indicator className={clsx(s.indicator, classes?.indicator)}>
          {indeterminate ? <MinusIcon /> : <CheckIcon className={s.icon} />}
        </BaseCheckbox.Indicator>
      )}
    </BaseCheckbox.Root>
  );
}
