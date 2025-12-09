import { Input, InputProps } from '@/components/common/form/Input';
import { FormLabel, FormLabelProps } from '@/components/common/form/FormLabel';

interface Props extends FormLabelProps{
  input: InputProps;
}

export function LabeledInput(props: Props) {
  const { error, label, input } = props;

  return (
    <FormLabel label={label} error={error}>
      <Input {...input} />
    </FormLabel>
  );
}
