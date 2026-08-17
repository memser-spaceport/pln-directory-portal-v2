'use client';

import { useMemo, useState } from 'react';
import { Field } from '@base-ui-components/react/field';
import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';
import Select, { components } from 'react-select';

import { CloseIcon } from '@/components/icons';
import { useScrollIntoViewOnFocus } from '@/hooks/useScrollIntoViewOnFocus';
import type { MultiSelectOption } from '@/components/form/FormMultiSelect';
// Chrome is production's own `FormMultiSelect` stylesheet and its literal
// `styles` object, copied value-for-value — 8px radius, 42px input, the
// #5E718D hover ring, the 2px chip gap. Only the ✕ is different.
import s from '@/components/form/FormMultiSelect/FormMultiSelect.module.scss';

interface PreferenceMultiSelectProps {
  name: string;
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  menuPortalTarget?: HTMLElement | null;
}

/**
 * `FormMultiSelect`, transcribed, for the same reason `SkillsTagsInput` exists:
 * its chip ✕ is react-select's bundled `CrossIcon` — a filled heavy cross in
 * near-black — and every other ✕ in this flow is the DS `CloseIcon` in grey.
 * The production component takes no `components` prop, so there is no override
 * hook; the only way to change the glyph is to own the `Select`.
 *
 * A remove control is secondary to the label it's attached to. At primary-text
 * weight it competes with the thing it removes, and reads as destructive rather
 * than as the quiet dismissal it is.
 *
 * **Deliberately dropped**, because this modal passes none of them: `showNone`
 * and its None-clears-everything arbitration, `notFoundContent` and its
 * sentinel option, `isRequired`, `disabled`, and `description`. What remains is
 * production's behaviour verbatim — client-side filter, alphabetical sort,
 * `isClearable={false}`, portalled menu.
 */
export function PreferenceMultiSelect(props: PreferenceMultiSelectProps) {
  const { name, label, placeholder, options, menuPortalTarget } = props;
  const {
    formState: { errors },
    setValue,
    getValues,
  } = useFormContext();

  const [inputValue, setInputValue] = useState('');
  const val = (getValues()[name] as MultiSelectOption[]) ?? [];

  const sortedOptions = useMemo(
    () =>
      [...options]
        .filter((option) => !inputValue || option.label.toLowerCase().includes(inputValue.toLowerCase()))
        .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase())),
    [options, inputValue],
  );

  useScrollIntoViewOnFocus<HTMLInputElement>({ id: name });

  return (
    <Field.Root className={s.field} invalid={!!errors[name]}>
      <Field.Label className={s.label}>{label}</Field.Label>
      <Select
        menuPlacement="auto"
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPortalTarget ? 'fixed' : undefined}
        isMulti
        onInputChange={(value) => setInputValue(value)}
        inputValue={inputValue}
        options={sortedOptions}
        isClearable={false}
        placeholder={placeholder}
        inputId={name}
        value={val}
        onChange={(next) => setValue(name, next ?? [], { shouldValidate: true, shouldDirty: true })}
        components={{
          MultiValue: (multiProps) => (
            <components.MultiValue {...multiProps}>
              <span className={s.multiValueInner}>{multiProps.data.label}</span>
            </components.MultiValue>
          ),
          // The one substitution. `CloseIcon` is stroked and takes `currentColor`,
          // so its tone is the `multiValueRemove` colour below — same grey, same
          // 14px, as the Refer modal's recipient chips and the skills tags.
          MultiValueRemove: (removeProps) => (
            <components.MultiValueRemove {...removeProps}>
              <CloseIcon width={14} height={14} />
            </components.MultiValueRemove>
          ),
          Option: (optionProps) => (
            <components.Option {...optionProps}>
              <span className={s.optionInner}>{optionProps.data.label}</span>
            </components.Option>
          ),
        }}
        styles={{
          container: (base) => ({ ...base, width: '100%' }),
          control: (baseStyles) => ({
            ...baseStyles,
            alignItems: 'center',
            gap: '8px',
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
            '> div': {
              gap: '2px',
              padding: '2px 4px',
            },
          }),
          input: (baseStyles) => ({
            ...baseStyles,
            height: '42px',
            fontSize: '14px',
            padding: 0,
            display: 'flex !important',
            '&:after': { display: 'none !important' },
          }),
          placeholder: (base) => ({
            ...base,
            width: 'fit-content',
            color: '#AFBACA',
            fontSize: '14px',
          }),
          option: (baseStyles) => ({
            ...baseStyles,
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: '20px',
            letterSpacing: '-0.2px',
            color: '#455468',
            padding: '12px 8px',
            '&:hover': { background: 'rgba(27, 56, 96, 0.12)' },
          }),
          menu: (baseStyles) => ({ ...baseStyles, outline: 'none', zIndex: 3 }),
          menuPortal: (base) => ({ ...base, zIndex: 10000 }),
          multiValueRemove: (base) => ({
            ...base,
            height: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '2px',
            paddingRight: '2px',
            color: 'var(--foreground-neutral-tertiary, #8897ae)',
            transition: 'color 0.2s ease',
            '&:hover': {
              background: 'transparent',
              color: 'var(--foreground-neutral-secondary, #455468)',
            },
          }),
          multiValue: (base) => ({
            ...base,
            marginBlock: 0,
            display: 'flex',
            padding: 'var(--spacing-4xs, 4px) var(--spacing-3xs, 6px)',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 'var(--spacing-5xs, 2px)',
            borderRadius: 'var(--corner-radius-sm, 6px)',
            border: '1px solid var(--border-neutral-subtle, rgba(27, 56, 96, 0.12))',
            background: 'var(--background-base-white, #FFF)',
            boxShadow: '0px 1px 2px 0px var(--transparent-dark-6, rgba(14, 15, 17, 0.06))',
          }),
          multiValueLabel: (base) => ({
            ...base,
            fontSize: '14px',
            color: '#455468',
            fontWeight: 300,
            fontStyle: 'normal',
            letterSpacing: '-0.2px',
          }),
          indicatorSeparator: () => ({ display: 'none' }),
        }}
        classNames={{
          placeholder: () => clsx(s.placeholder, { [s.hidePlaceholder]: val.length > 0 }),
          control: () => s.control,
        }}
      />
    </Field.Root>
  );
}
