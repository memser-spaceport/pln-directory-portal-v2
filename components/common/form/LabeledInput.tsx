import { FormLabel } from '@/components/common/form/FormLabel';
import { Input, InputProps } from '@/components/common/form/Input';

interface Props {
  label: string;
  input: InputProps;
}

export function LabeledInput(props: Props) {
  const { label, input } = props;

  return (
    <FormLabel label={label}>
      <Input {...input} />
    </FormLabel>
  );
}
