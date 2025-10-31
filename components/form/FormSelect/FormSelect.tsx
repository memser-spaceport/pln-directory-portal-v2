import { clsx } from 'clsx';
import Select from 'react-select';
import { useMedia, useToggle } from 'react-use';
import React, { ReactNode, useState } from 'react';

import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';

import { MobileFormSelectView } from './components/MobileFormSelectView';

import s from './FormSelect.module.scss';

import { Option } from './types';

type RenderOptionInput = {
  option: Option;
  label: ReactNode;
  description: ReactNode;
};

interface Props {
  name: string;
  placeholder: string;
  label?: string;
  description?: string;
  options: Option[];
  disabled?: boolean;
  isRequired?: boolean;
  notFoundContent?: ReactNode;
  isStickyNoData?: boolean;
  backLabel?: string;
  onChange?: (value: Option | null) => void;
  renderOption?: (input: RenderOptionInput) => ReactNode;
}

export const FormSelect = (props: Props) => {
  const {
    name,
    placeholder,
    label,
    description,
    options,
    disabled,
    isRequired,
    notFoundContent,
    backLabel,
    onChange,
    isStickyNoData,
  } = props;

  const {
    watch,
    formState: { errors },
    setValue,
  } = useFormContext();

  const value = watch(name);

  const renderSelectOption = (option: Option) => {
    const renderOption =
      props.renderOption ||
      function ({ label, description }) {
        return (
          <>
            {label}
            {description}
          </>
        );
      };

    const { label, description } = option;

    return renderOption({
      option,
      label: <div className={s.optionLabel}>{label}</div>,
      description: description && <div className={s.optionDesc}>{description}</div>,
    });
  };

  const [open, toggleOpen] = useToggle(false);
  const isMobile = useMedia('(max-width: 960px)', false);
  const [searchTerm, setSearchTerm] = useState('');

  // Create options array with notFoundContent as the last option
  const enhancedOptions = React.useMemo(() => {
    const baseOptions = [...options];
    if (notFoundContent) {
      baseOptions.push({
        label: '',
        value: '__not_found_content__',
        isNotFoundContent: true,
      } as any);
    }
    return baseOptions;
  }, [options, notFoundContent]);

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: name });

  return (
    <>
      {open && (
        <MobileFormSelectView
          name={name}
          options={options}
          onChange={onChange}
          backLabel={backLabel}
          toggleOpen={toggleOpen}
          placeholder={placeholder}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          notFoundContent={notFoundContent}
          renderSelectOption={renderSelectOption}
        />
      )}
      <Field.Root className={s.field}>
        {label && (
          <Field.Label
            className={clsx(s.label, {
              [s.required]: isRequired,
            })}
          >
            {label}
          </Field.Label>
        )}
        <Select
          menuPlacement="auto"
          placeholder={placeholder}
          options={enhancedOptions}
          value={value}
          defaultValue={value}
          onChange={(val) => {
            // Don't allow selection of the notFoundContent option
            if (val && (val as any).isNotFoundContent) {
              return;
            }
            setValue(name, val, { shouldValidate: true, shouldDirty: true });
            onChange?.(val as { label: string; value: string } | null);
          }}
          isDisabled={disabled || open}
          inputId={name}
          filterOption={(option, inputValue) => {
            // Always include the notFoundContent option
            if ((option.data as any).isNotFoundContent) {
              return true;
            }
            // Default filtering for regular options
            return option.label.toLowerCase().includes(inputValue.toLowerCase());
          }}
          onMenuOpen={() => {
            if (!isMobile) {
              return;
            }

            toggleOpen();
          }}
          styles={{
            container: (base) => ({
              ...base,
              width: '100%',
            }),
            control: (baseStyles) => ({
              ...baseStyles,
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'stretch',
              borderRadius: '8px',
              border: '1px solid rgba(203, 213, 225, 0.50)',
              background: '#fff',
              outline: 'none',
              minWidth: '140px',
              width: '100%',
              borderColor: 'rgba(203, 213, 225, 0.50) !important',
              position: 'relative',
              fontSize: '16px',
              color: '#455468',
              boxShadow: 'none !important',
              '&:hover': {
                border: '1px solid #5E718D',
                boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
                borderColor: '#5E718D !important',
              },
              '&:focus-visible, &:focus': {
                borderColor: '#5E718D !important',
                boxShadow: '0 0 0 4px rgba(27, 56, 96, 0.12) !important',
              },
              ...(!!errors[name]
                ? {
                    borderColor: 'var(--action-border-error-focus) !important',
                  }
                : {}),
            }),
            input: (baseStyles) => ({
              ...baseStyles,
              height: '42px',
              padding: 0,
              fontSize: 16,
              // background: 'tomato',
            }),
            option: (baseStyles) => ({
              ...baseStyles,
              fontSize: '14px',
              fontWeight: 300,
              color: '#455468',
              '&:hover': {
                background: 'rgba(27, 56, 96, 0.12)',
              },
            }),
            menuList: (base) => ({
              ...base,
              width: '100%',
              padding: 0,
            }),
            menu: (baseStyles) => ({
              ...baseStyles,
              outline: 'none',
              zIndex: 3,
              display: 'flex',
              padding: '8px',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }),
            placeholder: (baseStyles) => ({
              ...baseStyles,
              color: '#CBD5E1',
            }),
            indicatorSeparator: (base) => ({
              display: 'none',
            }),
          }}
          components={{
            NoOptionsMessage: () => {
              return (
                <div className={s.notFound}>
                  <span>No options found</span>
                  {notFoundContent}
                </div>
              );
            },
            Option: (props) => {
              // Handle the special notFoundContent option
              if ((props.data as any).isNotFoundContent) {
                return (
                  <div
                    className={clsx(s.notFoundContent, {
                      [s.sticky]: isStickyNoData,
                    })}
                  >
                    {notFoundContent}
                  </div>
                );
              }

              return (
                <div onClick={() => props.selectOption(props.data)} className={s.option}>
                  {renderSelectOption(props.data)}
                </div>
              );
            },
          }}
        />
        {!errors[name] && description ? (
          <Field.Description className={s.fieldDescription}>{description}</Field.Description>
        ) : (
          <Field.Error className={s.errorMsg} match={!!errors[name]}>
            {(errors?.[name]?.message as string) ?? ''}
          </Field.Error>
        )}
      </Field.Root>
    </>
  );
};
