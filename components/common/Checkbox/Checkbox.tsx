import clsx from 'clsx';
import React from 'react';
import { Checkbox as BaseCheckbox } from '@base-ui-components/react/checkbox';

import { CheckIcon } from '@/components/icons';

import s from './Checkbox.module.scss';

interface Props {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  classes?: {
    root?: string;
    indicator?: string;
  };
}

export function Checkbox(props: Props) {
  const { checked, classes, onChange } = props;

  return (
    <BaseCheckbox.Root checked={checked} className={clsx(s.checkbox, classes?.root)} onCheckedChange={onChange}>
      <BaseCheckbox.Indicator className={clsx(s.indicator, classes?.indicator)}>
        <CheckIcon className={s.icon} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
