import isNumber from 'lodash/isNumber';
import { clsx } from 'clsx';

import { Checkbox } from '@/components/common/Checkbox';

import s from './CheckboxListItemRepresentation.module.scss';

type Props = {
  label: string;
  count?: number;
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function CheckboxListItemRepresentation(props: Props) {
  const { label, count, checked, disabled, onClick } = props;

  return (
    <div
      className={clsx(s.root, { [s.disabled]: disabled })}
      onClick={onClick}
    >
      <div className={s.content}>
        <Checkbox
          checked={checked}
          disabled={disabled}
          classes={{
            root: s.checkbox,
          }}
        />
        {label}
      </div>
      {isNumber(count) && <div className={s.badge}>{count}</div>}
    </div>
  );
}
