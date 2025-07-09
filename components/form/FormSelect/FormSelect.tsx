import React, { useState } from 'react';
import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';

import Select, { GroupBase, OptionsOrGroups } from 'react-select';

import s from './FormSelect.module.scss';

interface Props {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  options: OptionsOrGroups<string, GroupBase<string>>;
  disabled?: boolean;
}

export const FormSelect = ({ name, placeholder, label, description, options, disabled }: Props) => {
  const {
    watch,
    formState: { errors },
    setValue,
  } = useFormContext();
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const isMobile = window.innerWidth <= 768;

  const value = watch(name);

  return (
    <Field.Root className={s.field}>
      {label && <Field.Label className={s.label}>{label}</Field.Label>}
      <Select
        placeholder="Project"
        options={options}
        value={value}
        defaultValue={value}
        onChange={(val) => {
          setValue(name, val, { shouldValidate: true, shouldDirty: true });
          if (isMobile) {
            setMenuIsOpen(false);
          }
        }}
        isDisabled={disabled}
        menuIsOpen={menuIsOpen}
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={isMobile ? undefined : () => setMenuIsOpen(false)}
        closeMenuOnScroll={false}
        blurInputOnSelect={false}
        menuShouldBlockScroll={isMobile && menuIsOpen}
        styles={{
          container: (base) =>
            isMobile && menuIsOpen
              ? {
                  ...base,
                  width: '100%',
                  position: 'fixed',
                  left: 0,
                  top: 0,
                  zIndex: 10,
                  background: 'white',
                }
              : {
                  ...base,
                  width: '100%',
                },
          control: (baseStyles) =>
            isMobile && menuIsOpen
              ? {
                  ...baseStyles,
                  alignItems: 'center',
                  gap: '4px',
                  alignSelf: 'stretch',
                  borderRadius: '8px',
                  border: '1px solid rgba(203, 213, 225, 0.50)',
                  background: '#fff',
                  outline: 'none',
                  fontSize: '14px',
                  minWidth: '140px',
                  borderColor: 'rgba(203, 213, 225, 0.50) !important',
                  position: 'relative',
                  '&:hover': {
                    border: '1px solid rgba(66, 125, 255, 0.50)',
                    boxShadow: '0 0 0 4px rgba(21, 111, 247, 0.10)',
                    borderColor: 'rgba(66, 125, 255, 0.50) !important',
                  },
                  '&:focus-visible, &:focus': {
                    borderColor: 'rgba(66, 125, 255, 0.50) !important',
                    boxShadow: '0 0 0 4px rgba(21, 111, 247, 0.10) !important',
                  },
                  ...(!!errors[name]
                    ? {
                        borderColor: 'darkred !important',
                      }
                    : {}),
                  marginTop: '48px',
                  zIndex: 11,
                  marginInline: '4px',
                }
              : {
                  ...baseStyles,
                  alignItems: 'center',
                  gap: '4px',
                  alignSelf: 'stretch',
                  borderRadius: '8px',
                  border: '1px solid rgba(203, 213, 225, 0.50)',
                  background: '#fff',
                  outline: 'none',
                  fontSize: '14px',
                  minWidth: '140px',
                  width: '100%',
                  borderColor: 'rgba(203, 213, 225, 0.50) !important',
                  position: 'relative',
                  '&:hover': {
                    border: '1px solid rgba(66, 125, 255, 0.50)',
                    boxShadow: '0 0 0 4px rgba(21, 111, 247, 0.10)',
                    borderColor: 'rgba(66, 125, 255, 0.50) !important',
                  },
                  '&:focus-visible, &:focus': {
                    borderColor: 'rgba(66, 125, 255, 0.50) !important',
                    boxShadow: '0 0 0 4px rgba(21, 111, 247, 0.10) !important',
                  },
                  ...(!!errors[name]
                    ? {
                        borderColor: 'darkred !important',
                      }
                    : {}),
                },
          input: (baseStyles) => ({
            ...baseStyles,
            height: '42px',
            padding: 0,
            // background: 'tomato',
          }),
          option: (baseStyles) => ({
            ...baseStyles,
            fontSize: '14px',
          }),
          menu: (baseStyles) =>
            isMobile && menuIsOpen
              ? {
                  ...baseStyles,
                  outline: 'none',
                  zIndex: 3,
                  width: '100%',
                  height: '100vh',
                  backgroundColor: 'white',
                  overflowY: 'auto',
                  marginTop: 0,
                  paddingInline: '4px',
                  border: 'none',
                  boxShadow: 'none',
                }
              : {
                  ...baseStyles,
                  outline: 'none',
                  zIndex: 3,
                },
        }}
      />
      {menuIsOpen && isMobile && (
        <button
          onClick={() => setMenuIsOpen(false)}
          style={{
            position: 'fixed',
            top: 10,
            right: 16,
            zIndex: 10002,
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          <CloseIcon />
        </button>
      )}
      {!errors[name] && description ? (
        <Field.Description className={s.fieldDescription}>{description}</Field.Description>
      ) : (
        <Field.Error className={s.errorMsg} match={!!errors[name]}>
          {(errors?.[name]?.message as string) ?? ''}
        </Field.Error>
      )}
    </Field.Root>
  );
};

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M9.85354 9.14628C9.9 9.19274 9.93684 9.24789 9.96199 9.30859C9.98713 9.36928 10.0001 9.43434 10.0001 9.50003C10.0001 9.56573 9.98713 9.63079 9.96199 9.69148C9.93684 9.75218 9.9 9.80733 9.85354 9.85378C9.80709 9.90024 9.75194 9.93709 9.69124 9.96223C9.63054 9.98737 9.56549 10.0003 9.49979 10.0003C9.43409 10.0003 9.36904 9.98737 9.30834 9.96223C9.24765 9.93709 9.1925 9.90024 9.14604 9.85378L4.99979 5.70691L0.85354 9.85378C0.759719 9.94761 0.632472 10.0003 0.49979 10.0003C0.367108 10.0003 0.23986 9.94761 0.14604 9.85378C0.0522194 9.75996 -0.000488279 9.63272 -0.000488281 9.50003C-0.000488284 9.36735 0.0522194 9.2401 0.14604 9.14628L4.29291 5.00003L0.14604 0.853784C0.0522194 0.759964 -0.000488281 0.632716 -0.000488281 0.500034C-0.000488281 0.367352 0.0522194 0.240104 0.14604 0.146284C0.23986 0.0524635 0.367108 -0.000244141 0.49979 -0.000244141C0.632472 -0.000244141 0.759719 0.0524635 0.85354 0.146284L4.99979 4.29316L9.14604 0.146284C9.23986 0.0524635 9.36711 -0.000244143 9.49979 -0.000244141C9.63247 -0.000244138 9.75972 0.0524635 9.85354 0.146284C9.94736 0.240104 10.0001 0.367352 10.0001 0.500034C10.0001 0.632716 9.94736 0.759964 9.85354 0.853784L5.70666 5.00003L9.85354 9.14628Z"
      fill="currentColor"
    />
  </svg>
);
