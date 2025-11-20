import { clsx } from 'clsx';
import { ReactNode } from 'react';
import isNumber from 'lodash/isNumber';

import { Checkbox } from '@/components/common/Checkbox';

import s from './CheckboxListItemRepresentation.module.scss';

type Props = {
  label: string;
  count?: number;
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  ctrlEl?: ReactNode;
  onClick: () => void;
};

export function CheckboxListItemRepresentation(props: Props) {
  const { label, count, ctrlEl, checked, disabled, indeterminate, onClick } = props;

  return (
    <div className={clsx(s.root, { [s.disabled]: disabled })} onClick={onClick}>
      <div className={s.content}>
        <Checkbox
          checked={checked}
          disabled={disabled}
          indeterminate={indeterminate}
          classes={{
            root: s.checkbox,
          }}
        />
        {ctrlEl}
        {label}
      </div>
      {isNumber(count) && <div className={s.badge}>{count}</div>}
    </div>
  );
}
