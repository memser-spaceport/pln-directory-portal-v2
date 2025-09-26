import map from 'lodash/map';
import uniqBy from 'lodash/uniqBy';
import isEmpty from 'lodash/isEmpty';
import { useCallback, useMemo } from 'react';

import { Option } from '@/services/members/types';

import { CheckboxListItemRepresentation } from './CheckboxListItemRepresentation';

interface Props {
  data: Option[];
  selected: Option[];
  paramKey: string;
  setValue: (key: string, vals: Option[], params: Record<string, boolean>) => void;
}

export function SelectAll(props: Props) {
  const { data, selected, paramKey, setValue } = props;

  const count = useMemo(
    () =>
      [...data, ...selected].reduce((acc, { count }) => {
        return acc + (count || 0);
      }, 0),
    [data, selected],
  );

  const checked = useMemo(() => {
    const dataValues = map(data, 'value');
    const selectedValues = map(selected, 'value');

    return dataValues.every((value) => selectedValues.includes(value));
  }, [data, selected]);

  const onClick = useCallback(() => {
    const newValue = checked ? [] : uniqBy([...selected, ...data], 'value');

    setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });
  }, [data, checked, selected]);

  if (isEmpty(data) && isEmpty(selected)) {
    return null;
  }

  return (
    <CheckboxListItemRepresentation
      count={count}
      checked={checked}
      label="Select all matching options"
      onClick={onClick}
    />
  );
}
