import { HTMLAttributes } from 'react';
import { Input } from '@/components/common/Input';

import s from './LinkAccountInput.module.scss';

interface Props {
  label: string;
  input?: HTMLAttributes<HTMLInputElement>;
}

export function LinkAccountInput(props: Props) {
  const { label, input } = props;

  return (
    <div className={s.root}>
      <div className={s.label}>{label}</div>
      <Input {...input} />
    </div>
  );
}
