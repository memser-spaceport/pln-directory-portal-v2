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

  const checked = useMemo(() => {
    const dataValues = map(data, 'value');
    const selectedValues = map(selected, 'value');

    return !(isEmpty(data) || isEmpty(selectedValues)) && dataValues.every((value) => selectedValues.includes(value));
  }, [data, selected]);

  const onClick = useCallback(() => {
    const newValue = checked ? [] : uniqBy([...selected, ...data], 'value');

    setValue(paramKey, newValue, { shouldValidate: true, shouldDirty: true });
  }, [data, checked, selected]);

  return <CheckboxListItemRepresentation checked={checked} label="Select all matching options" onClick={onClick} />;
}
