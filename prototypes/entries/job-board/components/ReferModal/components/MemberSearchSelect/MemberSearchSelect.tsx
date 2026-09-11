'use client';

import { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import Select, { ClearIndicatorProps, components, MenuProps, SingleValueProps } from 'react-select';

import { Field } from '@base-ui-components/react/field';

// The plus is the DS icon, the same one the recipients field's own last line uses —
// see `RecipientInput`, which this row is transcribed from.
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
  /** Leaves the search for the three outside-network inputs, carrying whatever was
   *  typed so a name that found nobody isn't typed twice. Omitted, the row is not
   *  rendered and the field is a member search and nothing else. */
  onReferOutside?: (typed: string) => void;
}

/** What `MenuWithOutsideRow` needs, handed down through react-select's own
 *  `selectProps` rather than captured in a closure — see the component below. */
interface OutsideRowProps {
  onReferOutside?: (typed: string) => void;
  /** The live query, so the row can carry it into the outside form. */
  outsideQuery: string;
  /** Whether any rows stand above the row, which is what its hairline separates it from. */
  hasRowsAbove: boolean;
}

/* Module scope, not an inline arrow in `components`: an inline component has a new
   identity on every render — every keystroke here, since the query is state — and
   react-select remounts the menu, which drops the list's scroll position and flickers
   the row. Its inputs arrive on `selectProps` for the same reason a closure won't do,
   and refs can't: this component must not be rebuilt to see a new query, and reading a
   ref during render is what `react-hooks/refs` forbids. The other overrides get away
   with being inline because remounting an option row costs nothing anyone can see. */
function MenuWithOutsideRow(menuProps: MenuProps<Option, false>) {
  const { onReferOutside, outsideQuery, hasRowsAbove } = menuProps.selectProps as unknown as OutsideRowProps;

  return (
    <components.Menu {...menuProps}>
      {menuProps.children}
      {onReferOutside && (
        <button
          type="button"
          className={`${s.outsideRow} ${hasRowsAbove ? '' : s.outsideRowAlone}`}
          // mousedown, not click: react-select closes the menu when its input blurs, and
          // a click's mousedown is what blurs it — by the time the click would fire,
          // this row has been unmounted with the menu.
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onReferOutside(outsideQuery.trim());
          }}
        >
          <span className={s.outsideGlyph}>
            <PlusIcon width={16} height={16} />
          </span>
          Refer someone not in PL network
        </button>
      )}
    </components.Menu>
  );
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
 * - The menu no longer stays shut until something is typed. It used to, matching
 *   FormSelect's `hideOptionsWhenEmpty` — with nothing typed there was nothing to show.
 *   There is now: the row below is a standing offer, and it has to be reachable by
 *   someone who already knows their friend isn't a member. Before a query the menu holds
 *   that row alone, which is also why `NoOptionsMessage` is suppressed there — react-select
 *   would otherwise answer a question nobody asked with "No members found".
 *
 * The menu ends in one standing row, **Refer someone not in PL network**, in every
 * state — an empty field, a result list, a list with nothing in it. It is the same
 * question this field asks, answered for a person the directory can't return, so it
 * lives in this field rather than beside it: a second door next to the search would be
 * two controls for one question.
 *
 * Known gap: the row is a button inside a portalled menu, reached by mousedown, so it
 * is not on the keyboard path — arrow keys walk react-select's options and Tab blurs
 * the input, which closes the menu. Making it a real option with a sentinel value fixes
 * that, at the cost of hand-rendering the no-results and loading states, since a
 * permanently present option suppresses both of react-select's slots.
 *
 * If this graduates, the production change is an async variant of `FormSelect`.
 */
export function MemberSearchSelect(props: MemberSearchSelectProps) {
  const { name, label, placeholder, menuPortalTarget, onReferOutside } = props;

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
        // Read off `selectProps` by the menu override above. Spread, because they are
        // this file's props rather than react-select's.
        {...({ onReferOutside, outsideQuery: query, hasRowsAbove: hasQuery } as object)}
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
          // The field still reads as a search, not a dropdown: what clicking in reveals
          // is one row offering a way out, not a chevron's promise of a finite list.
          DropdownIndicator: () => null,
          Menu: MenuWithOutsideRow,
          // Only once something has been typed. Before that there is no query for
          // "No members found" to be the answer to, and the menu is carrying the
          // outside row alone.
          //
          // The second line used to read "Only members in the directory can be
          // referred." That stopped being true the day the row below it went in, and a
          // sentence pointing at a visible control only restates it — so the signed-in
          // arm is a single line now.
          NoOptionsMessage: () =>
            hasQuery ? (
              <div className={fieldCss.notFound}>
                <span>{isUnauthorized ? 'Sign in to search members' : 'No members found'}</span>
                {isUnauthorized && <span>Member search needs a signed-in session.</span>}
              </div>
            ) : null,
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
