import { Input, InputProps } from '@/components/common/Input';

import s from './LabeledInput.module.scss';

interface Props {
  label: string;
  input: InputProps;
}

export function LabeledInput(props: Props) {
  const { label, input } = props;

  return (
    <div className={s.root}>
      <div className={s.label}>{label}</div>
      <Input {...input} />
    </div>
  );
}
