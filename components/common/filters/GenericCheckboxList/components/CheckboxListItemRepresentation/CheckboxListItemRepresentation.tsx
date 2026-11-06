import { clsx } from 'clsx';
import { ReactNode, useId } from 'react';
import isNumber from 'lodash/isNumber';

import { Checkbox } from '@/components/common/Checkbox';

import s from './CheckboxListItemRepresentation.module.scss';

type Props = {
  label: ReactNode;
  count?: number;
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  ctrlEl?: ReactNode;
  onClick: () => void;
};

export function CheckboxListItemRepresentation(props: Props) {
  const { label, count, ctrlEl, checked, disabled, indeterminate, onClick } = props;
  // The visible label names the checkbox (LAB-3095); `display: contents` keeps the layout as it was.
  const labelId = useId();

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
          aria-labelledby={labelId}
        />
        {ctrlEl}
        <span id={labelId} style={{ display: 'contents' }}>
          {label}
        </span>
      </div>
      {isNumber(count) && <div className={s.badge}>{count}</div>}
    </div>
  );
}
