import { useMemo } from 'react';
import isNumber from 'lodash/isNumber';

import { Option } from '@/services/members/types';
import { Checkbox } from '@/components/common/Checkbox';

import s from './CheckboxListItem.module.scss';

type Props = {
  item: Option;
  values: Option[];
  paramKey: string;
  setValue: (key: string, vals: Option[], params: Record<string, boolean>) => void;
};

export function CheckboxListItem(props: Props) {
  const { item, values, paramKey, setValue } = props;

  const { value, label, count } = item;

  const checked = useMemo(() => {
    return !!values?.some(({ value: val }) => val === value);
  }, [value, values]);

  function onClick() {
    if (checked) {
      // Remove from selection
      const newValue = values.filter(({ value: val }) => val !== value);
      setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });
    } else {
      // Add to selection
      const newValue = [...values, item];
      setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });
    }
  }

  return (
    <div className={s.root} onClick={onClick}>
      <div className={s.content}>
        <Checkbox
          checked={checked}
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
