import { InputHTMLAttributes } from 'react';
import { Input } from '@/components/common/Input';

import s from './LinkAccountInput.module.scss';

interface Props {
  label: string;
  input: InputHTMLAttributes<HTMLInputElement>;
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
