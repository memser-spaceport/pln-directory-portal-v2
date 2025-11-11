import { FilterOption } from '@/services/filters/commonTypes';
import { useMemo } from 'react';

import { CheckboxListItemRepresentation } from './CheckboxListItemRepresentation';

type Props = {
  item: FilterOption;
  values: FilterOption[];
  paramKey: string;
  setValue: (key: string, vals: FilterOption[], params: Record<string, boolean>) => void;
};

export function CheckboxListItem(props: Props) {
  const { item, values, paramKey, setValue } = props;

  const { value, label, count, disabled } = item;

  const checked = useMemo(() => {
    return !!values?.some(({ value: val }) => val === value);
  }, [value, values]);

  function onClick() {
    // Don't allow interaction if disabled
    if (disabled) return;

    const newValue = checked ? values.filter(({ value: val }) => val !== value) : [...values, item];

    setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });
  }

  return (
    <CheckboxListItemRepresentation
      label={label}
      count={count}
      checked={checked}
      disabled={disabled}
      onClick={onClick}
    />
  );
}
