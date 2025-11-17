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
}

export function Checkbox(props: Props) {
  const { checked, disabled, classes, onChange, indeterminate } = props;

  return (
    <BaseCheckbox.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={onChange}
      indeterminate={indeterminate}
      className={clsx(s.root, classes?.root, {
        [s.checked]: checked,
        [s.indeterminate]: indeterminate,
      })}
    >
      {(checked || indeterminate) && (
        <BaseCheckbox.Indicator className={clsx(s.indicator, classes?.indicator)}>
          {checked ? <CheckIcon className={s.icon} /> : <MinusIcon />}
        </BaseCheckbox.Indicator>
      )}
    </BaseCheckbox.Root>
  );
}
