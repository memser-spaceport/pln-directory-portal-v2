import map from 'lodash/map';
import uniqBy from 'lodash/uniqBy';
import isEmpty from 'lodash/isEmpty';
import { useCallback, useMemo } from 'react';

import { FilterOption } from '@/services/filters/commonTypes';

import { CheckboxListItemRepresentation } from './CheckboxListItemRepresentation';

interface Props {
  data: FilterOption[];
  selected: FilterOption[];
  paramKey: string;
  setValue: (key: string, vals: FilterOption[], params: Record<string, boolean>) => void;
  onSelectAll?: (wasChecked: boolean) => void;
}

export function SelectAll(props: Props) {
  const { data, selected, paramKey, setValue, onSelectAll } = props;

  const checked = useMemo(() => {
    const dataValues = map(data, 'value');
    const selectedValues = map(selected, 'value');

    return dataValues.every((value) => selectedValues.includes(value));
  }, [data, selected]);

  const onClick = useCallback(() => {
    const newValue = checked ? [] : uniqBy([...selected, ...data], 'value');

    setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });

    if (onSelectAll) {
      onSelectAll(checked);
    }
  }, [data, checked, selected, paramKey, setValue, onSelectAll]);

  if (isEmpty(data) && isEmpty(selected)) {
    return null;
  }

  return <CheckboxListItemRepresentation checked={checked} label="Select all matching options" onClick={onClick} />;
}
