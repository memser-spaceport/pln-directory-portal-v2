import { FC } from 'react';
import { ErrorMessage as FormErrorMessage } from '@hookform/error-message';

import s from './FormFieldError.module.css';

interface Props {
  name: string;
}

export const FormFieldError: FC<Props> = ({ name }) => {
  return (
    <FormErrorMessage
      name={name}
      render={({ message }) => {
        console.log(message, name);
        return (
          <div className={s.root}>
            <p className={s.message}>{message}</p>
          </div>
        );
      }}
    />
  );
};
