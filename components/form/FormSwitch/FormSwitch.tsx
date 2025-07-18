import React from 'react';
import { Switch } from '@base-ui-components/react/switch';
import { useFormContext } from 'react-hook-form';
import s from './FormSwitch.module.scss';
import { clsx } from 'clsx';

interface Props {
  name: string;
  label?: string;
  variant?: 'primary' | 'secondary';
}

export const FormSwitch = ({ name, label, variant = 'primary' }: Props) => {
  const { watch, setValue } = useFormContext();
  const values = watch();
  const val = values[name];

  return (
    <label
      className={clsx(s.Label, {
        [s.secondary]: variant === 'secondary',
      })}
    >
      {label}
      <Switch.Root defaultChecked className={s.Switch} checked={val} onCheckedChange={() => setValue(name, !val, { shouldValidate: true, shouldDirty: true })}>
        <CloseIcon />
        <Switch.Thumb className={s.Thumb}>
          <CheckIcon />
        </Switch.Thumb>
      </Switch.Root>
    </label>
  );
};

const CheckIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.checkIcon}>
    <path
      d="M7.26628 2.51565L3.26628 6.51565C3.23144 6.55061 3.19004 6.57835 3.14446 6.59728C3.09888 6.6162 3.05001 6.62595 3.00065 6.62595C2.9513 6.62595 2.90243 6.6162 2.85684 6.59728C2.81126 6.57835 2.76986 6.55061 2.73503 6.51565L0.985025 4.76565C0.950143 4.73077 0.922473 4.68936 0.903595 4.64378C0.884716 4.59821 0.875 4.54936 0.875 4.50003C0.875 4.4507 0.884716 4.40185 0.903595 4.35627C0.922473 4.31069 0.950143 4.26928 0.985025 4.2344C1.01991 4.19952 1.06132 4.17185 1.1069 4.15297C1.15247 4.13409 1.20132 4.12438 1.25065 4.12438C1.29998 4.12438 1.34883 4.13409 1.39441 4.15297C1.43998 4.17185 1.48139 4.19952 1.51628 4.2344L3.00096 5.71909L6.73565 1.98503C6.8061 1.91458 6.90165 1.875 7.00128 1.875C7.1009 1.875 7.19645 1.91458 7.2669 1.98503C7.33735 2.05547 7.37693 2.15102 7.37693 2.25065C7.37693 2.35028 7.33735 2.44583 7.2669 2.51628L7.26628 2.51565Z"
      fill="#1B4DFF"
    />
  </svg>
);

const CloseIcon = () => (
  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" className={s.closeIcon}>
    <path
      d="M6.51627 5.98499C6.58672 6.05543 6.6263 6.15098 6.6263 6.25061C6.6263 6.35024 6.58672 6.44579 6.51627 6.51624C6.44583 6.58668 6.35028 6.62626 6.25065 6.62626C6.15102 6.62626 6.05547 6.58668 5.98502 6.51624L4.00096 4.53155L2.01628 6.51561C1.94583 6.58606 1.85028 6.62564 1.75065 6.62564C1.65102 6.62564 1.55547 6.58606 1.48503 6.51561C1.41458 6.44516 1.375 6.34962 1.375 6.24999C1.375 6.15036 1.41458 6.05481 1.48503 5.98436L3.46971 4.0003L1.48565 2.01561C1.4152 1.94516 1.37563 1.84962 1.37563 1.74999C1.37563 1.65036 1.4152 1.55481 1.48565 1.48436C1.5561 1.41391 1.65165 1.37434 1.75128 1.37434C1.8509 1.37434 1.94645 1.41391 2.0169 1.48436L4.00096 3.46905L5.98565 1.48405C6.0561 1.4136 6.15165 1.37402 6.25127 1.37402C6.3509 1.37402 6.44645 1.4136 6.5169 1.48405C6.58735 1.5545 6.62692 1.65005 6.62692 1.74967C6.62692 1.8493 6.58735 1.94485 6.5169 2.0153L4.53221 4.0003L6.51627 5.98499Z"
      fill="white"
      fillOpacity="0.32"
    />
  </svg>
);
