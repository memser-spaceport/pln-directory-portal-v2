'use client';

import { useMemo, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import Select, { ClearIndicatorProps, components, MenuProps, SingleValueProps } from 'react-select';

import { Field } from '@base-ui-components/react/field';

import { CloseIcon, PlusIcon } from '@/components/icons';
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
  /** The menu's way out for a person the directory doesn't hold. Called with
   *  whatever was typed, so a name that found nobody isn't typed twice. */
  onReferOutside?: (typed: string) => void;
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
 * One deliberate departure, a consequence of searching server-side: FormSelect's
 * mobile sheet (`MobileFormSelectView`) is gone. It exists to make a 2.8k-row list
 * usable on a phone by filtering it in a full-screen view; a 15-row answer to a
 * query needs no such thing, and that view can only filter options it already holds.
 *
 * The menu opens on click with a browse page of network members before anything is
 * typed (the mocked `useMemberSearch` serves it), so seeing the drafted note never
 * requires knowing a name — the job-board copy keeps its type-first menu, because
 * the live API cannot answer an empty query.
 *
 * The menu ends in one standing row, **Refer someone outside the network**, in
 * every state — the browse page, a result list, an empty one. It is the same
 * question this field asks, answered for a person the directory can't return, so
 * it lives in this field rather than beside it (a second door next to the search
 * would be two controls for one question). Standing rather than shown only on
 * "no results": someone who already knows their friend isn't a member shouldn't
 * have to type a name to find out they can still refer them. Pressing it hands
 * the field's job to three inputs in the modal — see `ReferModal`.
 *
 * If this graduates, the production change is an async variant of `FormSelect`.
 */
export function MemberSearchSelect(props: MemberSearchSelectProps) {
  const { name, label, placeholder, menuPortalTarget, onReferOutside } = props;

  const { watch, setValue } = useFormContext();
  const value = watch(name);

  const [query, setQuery] = useState('');
  const { results, isSearching, isUnauthorized } = useMemberSearch(query);

  const options = useMemo<Option[]>(() => results.map(toOption), [results]);

  // Read through refs so the Menu override below can be created once. An inline
  // component in `components` remounts the menu on every render — every keystroke
  // here, since the query is state — which drops the list's scroll position and
  // flickers the row. The other overrides in this file get away with being inline
  // because remounting an option row costs nothing anyone can see.
  const queryRef = useRef(query);
  queryRef.current = query;
  const onReferOutsideRef = useRef(onReferOutside);
  onReferOutsideRef.current = onReferOutside;

  const MenuWithOutsideRow = useMemo(
    () =>
      function MenuWithOutsideRow(menuProps: MenuProps<Option, false>) {
        return (
          <components.Menu {...menuProps}>
            {menuProps.children}
            {onReferOutsideRef.current && (
              <button
                type="button"
                className={s.outsideRow}
                // mousedown, not click: react-select closes the menu when its input
                // blurs, and a click's mousedown is what blurs it — by the time the
                // click would fire, this row has been unmounted with the menu.
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onReferOutsideRef.current?.(queryRef.current.trim());
                }}
              >
                <span className={s.outsideGlyph}>
                  <PlusIcon width={16} height={16} />
                </span>
                Refer someone outside the network
              </button>
            )}
          </components.Menu>
        );
      },
    [],
  );

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
          // The field still reads as a search, not a dropdown — the browse page is
          // what clicking in reveals, not a chevron's promise of a finite list.
          DropdownIndicator: () => null,
          // The empty state used to end "Only members in the directory can be
          // referred." That stopped being true the day the row under it went in,
          // and the row is the way out — a sentence pointing at a visible control
          // restates it (lesson 15), so the second line is gone.
          NoOptionsMessage: () => (
            <div className={fieldCss.notFound}>
              <span>{isUnauthorized ? 'Sign in to search members' : 'No members found'}</span>
              {isUnauthorized && <span>Member search needs a signed-in session.</span>}
            </div>
          ),
          Menu: MenuWithOutsideRow,
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
