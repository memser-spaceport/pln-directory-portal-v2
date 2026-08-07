'use client';

import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import Select, { ClearIndicatorProps, components, SingleValueProps } from 'react-select';

import { Field } from '@base-ui-components/react/field';

import { CloseIcon } from '@/components/icons';
import type { Option } from '@/components/form/FormSelect/types';

// Field wrapper, label, option row and no-results treatment come from the production
// select, so this reads as the same field as the recipients one below it.
import fieldCss from '@/components/form/FormSelect/FormSelect.module.scss';

import { DirectoryMember } from '../../types';

import { getMemberMeta } from '../../utils/getMemberMeta';

import { useMemberSearch } from '../../hooks/useMemberSearch';

import { MemberAvatar } from '../MemberAvatar';

import { selectStyles } from './selectStyles';
import s from './MemberSearchSelect.module.scss';

interface MemberSearchSelectProps {
  /** react-hook-form field holding the chosen `Option` (with the member on `originalObject`). */
  name: string;
  label: string;
  placeholder: string;
  menuPortalTarget?: HTMLElement | null;
}

const toOption = (member: DirectoryMember): Option => ({
  label: member.name,
  value: member.uid,
  description: getMemberMeta(member),
  originalObject: member,
});

/**
 * "Who are you referring?" — one member, found by typing their name.
 *
 * Prototype-local for the same reason `RecipientPicker` is: production `FormSelect`
 * filters a static `options` array and never reports what was typed, so nothing can
 * drive a per-keystroke query through it — and the directory is 2.8k members, far too
 * many to hand it up front (see `useMemberSearch` for the measurements). Everything
 * else is transcribed from it rather than reinvented: the control and menu styles
 * verbatim (see `selectStyles`), and `.field` / `.label` / `.option` / `.optionLabel` /
 * `.optionDesc` / `.notFound` / `.clearIndicator` imported from its stylesheet.
 *
 * Two deliberate departures, both consequences of searching server-side:
 * - FormSelect's mobile sheet (`MobileFormSelectView`) is gone. It exists to make a
 *   2.8k-row list usable on a phone by filtering it in a full-screen view; a 15-row
 *   answer to a query needs no such thing, and that view can only filter options it
 *   already holds.
 * - The menu stays shut until something is typed, matching FormSelect's
 *   `hideOptionsWhenEmpty`: with nothing typed there is nothing to show.
 *
 * If this graduates, the production change is an async variant of `FormSelect`.
 */
export function MemberSearchSelect(props: MemberSearchSelectProps) {
  const { name, label, placeholder, menuPortalTarget } = props;

  const { watch, setValue } = useFormContext();
  const value = watch(name);

  const [query, setQuery] = useState('');
  const { results, isSearching, hasQuery, isUnauthorized } = useMemberSearch(query);

  const options = useMemo<Option[]>(() => results.map(toOption), [results]);

  const renderMemberRow = (option: Option, size: number) => (
    <div className={s.optionRow}>
      <MemberAvatar name={option.label} image={option.originalObject?.image} size={size} />
      <div className={s.optionText}>
        <div className={fieldCss.optionLabel}>{option.label}</div>
        {option.description && <div className={fieldCss.optionDesc}>{option.description}</div>}
      </div>
    </div>
  );

  return (
    <Field.Root className={fieldCss.field}>
      <Field.Label className={fieldCss.label}>{label}</Field.Label>

      <Select<Option, false>
        inputId={name}
        aria-label={label}
        placeholder={placeholder}
        options={options}
        value={value ?? null}
        onChange={(option) => setValue(name, option, { shouldValidate: true, shouldDirty: true })}
        inputValue={query}
        // Every action react-select reports has to be honoured, not just typing: it
        // clears the input after a pick, and while it thinks there's still text there
        // it renders no selected value at all — the field would look empty with
        // someone chosen in it. An empty query simply disables the search.
        onInputChange={(next) => setQuery(next)}
        // The directory already ranked and capped the matches — filtering them again
        // by substring would only throw away rows the server thought were relevant.
        filterOption={() => true}
        isLoading={isSearching}
        isClearable
        menuPlacement="auto"
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPortalTarget ? 'fixed' : undefined}
        styles={selectStyles}
        components={{
          // Nothing to drop down to before a query — same reasoning as the hidden menu.
          DropdownIndicator: () => null,
          Menu: (menuProps) =>
            hasQuery ? <components.Menu {...menuProps}>{menuProps.children}</components.Menu> : null,
          NoOptionsMessage: () => (
            <div className={fieldCss.notFound}>
              <span>{isUnauthorized ? 'Sign in to search members' : 'No members found'}</span>
              <span>
                {isUnauthorized
                  ? 'Member search needs a signed-in session.'
                  : 'Only members in the directory can be referred.'}
              </span>
            </div>
          ),
          // react-select shows this in place of the no-results message while a request
          // is out, and its default is a centred "Loading..." — the field's own
          // `.notFound` column keeps the menu from jumping between the two states.
          LoadingMessage: () => (
            <div className={fieldCss.notFound}>
              <span>Searching members…</span>
            </div>
          ),
          // Transcribed from FormSelect, quirk included: it renders its own row rather
          // than delegating to `components.Option`, so the hover state is the
          // stylesheet's `.option:hover` and not react-select's focused state.
          Option: (optionProps) => (
            <div onClick={() => optionProps.selectOption(optionProps.data)} className={fieldCss.option}>
              {renderMemberRow(optionProps.data, 32)}
            </div>
          ),
          // The chosen value carries the same avatar + role line as the menu row, so no
          // second "who you picked" card is needed under the field.
          SingleValue: (singleValueProps: SingleValueProps<Option, false>) => (
            <components.SingleValue {...singleValueProps}>
              <span className={s.valueRow}>
                <MemberAvatar
                  name={singleValueProps.data.label}
                  image={singleValueProps.data.originalObject?.image}
                  size={24}
                />
                <span className={s.valueName}>{singleValueProps.data.label}</span>
                {singleValueProps.data.description && (
                  <span className={s.valueMeta}>{singleValueProps.data.description}</span>
                )}
              </span>
            </components.SingleValue>
          ),
          ClearIndicator: (clearProps: ClearIndicatorProps<Option, false>) => (
            <div
              {...clearProps.innerProps}
              className={fieldCss.clearIndicator}
              onClick={(e) => {
                e.stopPropagation();
                setValue(name, null, { shouldValidate: true, shouldDirty: true });
              }}
            >
              <CloseIcon />
            </div>
          ),
        }}
      />
    </Field.Root>
  );
}
