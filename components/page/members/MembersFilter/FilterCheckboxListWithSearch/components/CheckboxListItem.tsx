import { Option } from '@/services/members/types';
import { useMemo } from 'react';

import { CheckboxListItemRepresentation } from './CheckboxListItemRepresentation';

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
    const newValue = checked ? values.filter(({ value: val }) => val !== value) : [...values, item];

    setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });
  }

  return <CheckboxListItemRepresentation label={label} count={count} checked={checked} onClick={onClick} />;
}
