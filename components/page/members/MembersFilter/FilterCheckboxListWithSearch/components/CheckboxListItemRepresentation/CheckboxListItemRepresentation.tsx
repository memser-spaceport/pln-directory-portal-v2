import isNumber from 'lodash/isNumber';

import { Checkbox } from '@/components/common/Checkbox';

import s from './CheckboxListItemRepresentation.module.scss';

type Props = {
  label: string;
  count?: number;
  checked: boolean;
  onClick: () => void;
};

export function CheckboxListItemRepresentation(props: Props) {
  const { label, count, checked, onClick } = props;

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
