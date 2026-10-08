import { clsx } from 'clsx';
import Select, { components, ControlProps, ClearIndicatorProps, InputProps, SelectInstance } from 'react-select';
import { useMedia, useToggle } from 'react-use';
import React, { ReactNode, useMemo, useRef, useState } from 'react';

import { Field } from '@base-ui-components/react/field';
import { useFormContext } from 'react-hook-form';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import { CloseIcon } from '@/components/icons';

import { MobileFormSelectView } from './components/MobileFormSelectView';

import s from './FormSelect.module.scss';

import { Option } from './types';

/* A new function each render remounts this input. Choosing a row then drops
   focus while the blue ring stays. A chosen value also sets isHidden, so the
   input is opacity 0 and Tab lands on it with nothing to see. */
function VisibleSelectInput(props: InputProps<Option, false>) {
  return <components.Input {...props} isHidden={false} />;
}

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
  formatOptionLabel?: (option: Option) => ReactNode;
  icon?: ReactNode;
  hideOptionsWhenEmpty?: boolean; // Hide options list when search field is empty
  isClearable?: boolean; // Show cross icon to clear selected value
  selectRef?: React.RefObject<SelectInstance | null>;
  menuPlacement?: 'top' | 'bottom' | 'auto';
  menuPortalTarget?: HTMLElement | null;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
  /**
   * The select's accessible name, for the rows that have no `label` of their own.
   *
   * react-select puts it on the combobox input `inputId` already points at, so a
   * caller that passes `label` should leave this alone — the visible label is
   * associated with that same input and would be overridden by this.
   */
  'aria-label'?: string;
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
    icon,
    hideOptionsWhenEmpty,
    isClearable,
    selectRef: externalSelectRef,
    formatOptionLabel,
    menuPlacement,
    menuPortalTarget,
    onMenuOpen: onMenuOpenProp,
    onMenuClose: onMenuCloseProp,
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
      // `title` so a name long enough to be truncated is still readable in
      // full on hover — an ellipsis that hides the only distinguishing part of
      // two similar names would make the list unusable rather than tidy.
      label: (
        <div className={s.optionLabel} title={typeof label === 'string' ? label : undefined}>
          {label}
        </div>
      ),
      description: description && <div className={s.optionDesc}>{description}</div>,
    });
  };

  const internalSelectRef = useRef<SelectInstance | null>(null);

  /* A new Control each render remounts the input. The blue ring then stays
     while the field is no longer the active control. */
  const Control = useMemo(() => {
    return function FormSelectControl(controlProps: ControlProps<Option, false>) {
      return (
        <components.Control {...controlProps}>
          {icon && <span className={s.icon}>{icon}</span>}
          {controlProps.children}
        </components.Control>
      );
    };
  }, [icon]);

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
          hideOptionsWhenEmpty={hideOptionsWhenEmpty}
        />
      )}
      <Field.Root className={s.field} invalid={!!errors[name]}>
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
          ref={
            ((instance: SelectInstance | null) => {
              internalSelectRef.current = instance;
              if (externalSelectRef) {
                (externalSelectRef as React.MutableRefObject<SelectInstance | null>).current = instance;
              }
            }) as any
          }
          menuPlacement={menuPlacement ?? 'auto'}
          menuPortalTarget={menuPortalTarget}
          menuPosition={menuPortalTarget ? 'fixed' : undefined}
          placeholder={placeholder}
          options={enhancedOptions}
          value={value}
          defaultValue={value}
          onChange={(val, meta) => {
            // Don't allow selection of the notFoundContent option
            if (val && (val as any).isNotFoundContent) {
              return;
            }
            setValue(name, val, { shouldValidate: true, shouldDirty: true });
            onChange?.(val as { label: string; value: string } | null);
            if (meta.action === 'select-option') {
              requestAnimationFrame(() => internalSelectRef.current?.focus());
            }
          }}
          isDisabled={disabled || open}
          inputId={name}
          aria-label={props['aria-label']}
          isClearable={isClearable}
          /* Chrome reports TouchEvent, so react-select blurs the field when a row is chosen. Keep the field focused. Only the list closes. */
          blurInputOnSelect={false}
          formatOptionLabel={formatOptionLabel}
          filterOption={(option, inputValue) => {
            if (hideOptionsWhenEmpty && !inputValue.trim()) {
              return false;
            }

            // Always include the notFoundContent option when there's input
            if ((option.data as any).isNotFoundContent) {
              return true;
            }
            // Default filtering for regular options
            return option.label.toLowerCase().includes(inputValue.toLowerCase());
          }}
          onMenuOpen={() => {
            onMenuOpenProp?.();
            if (!isMobile) {
              return;
            }

            toggleOpen();
          }}
          onMenuClose={() => {
            onMenuCloseProp?.();
          }}
          onKeyDown={(event) => {
            /* A closed list: Enter opens it. An open list keeps react-select's Enter, which chooses the row. */
            if (event.key !== 'Enter' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (event.nativeEvent.isComposing) return;
            if ((event.target as HTMLElement).getAttribute('aria-expanded') === 'true') return;
            event.preventDefault();
            internalSelectRef.current?.openMenu('first');
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
              /* The ring follows the real input, not react-select's focused flag. */
              '&:focus-within': {
                borderColor: 'rgba(27, 77, 255, 0.65) !important',
                boxShadow: 'none !important',
                outline: '2px solid rgba(27, 77, 255, 0.65)',
                outlineOffset: 2,
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
              fontWeight: 500,
              lineHeight: '20px',
              letterSpacing: '-0.2px',
              color: '#455468',
              '&:hover': {
                background: 'rgba(27, 56, 96, 0.12)',
              },
            }),
            menuList: (base) => ({
              ...base,
              width: '100%',
              padding: 0,
              // The menu is a flex column, so this list is a flex item: without
              // `minWidth: 0` its automatic minimum size is the widest option's
              // min-content width, and one long label makes the whole list
              // wider than the menu. That overflow is what turned `overflow-y:
              // auto` into a horizontal scrollbar (a non-visible value on one
              // axis computes the other away from `visible`).
              minWidth: 0,
              minHeight: 0,
              overflowX: 'hidden' as const,
              overflowY: 'auto' as const,
            }),
            menu: (baseStyles) => ({
              ...baseStyles,
              outline: 'none',
              zIndex: 3,
              display: 'flex',
              padding: '8px',
              flexDirection: 'column',
              // `stretch` so the list fills the menu's width instead of sizing
              // itself to its longest option.
              alignItems: 'stretch',
            }),
            menuPortal: (base) => ({ ...base, zIndex: 10000 }),
            placeholder: (baseStyles) => ({
              ...baseStyles,
              color: '#CBD5E1',
            }),
            indicatorSeparator: (base) => ({
              display: 'none',
            }),
          }}
          components={{
            Input: VisibleSelectInput,
            DropdownIndicator: (props) => {
              if (hideOptionsWhenEmpty) {
                return null;
              }

              return <components.DropdownIndicator {...props} />;
            },
            Menu: (props) => {
              if (props.selectProps.inputValue.trim() === '' && hideOptionsWhenEmpty) {
                return null;
              }

              return <components.Menu {...props}>{props.children}</components.Menu>;
            },
            Control,
            ClearIndicator: (props: ClearIndicatorProps<Option, false>) => (
              <div
                {...props.innerProps}
                className={s.clearIndicator}
                onClick={(e) => {
                  e.stopPropagation();
                  setValue(name, null, { shouldValidate: true, shouldDirty: true });
                  onChange?.(null);
                }}
              >
                <CloseIcon />
              </div>
            ),
            NoOptionsMessage: (props) => {
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
                    onClick={() => internalSelectRef.current?.blur()}
                  >
                    {notFoundContent}
                  </div>
                );
              }

              return (
                <div
                  /* react-select scrolls the list to this node when arrows move the highlight. */
                  ref={props.innerRef}
                  {...props.innerProps}
                  className={clsx(s.option, props.isFocused && s.optionFocused)}
                >
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
