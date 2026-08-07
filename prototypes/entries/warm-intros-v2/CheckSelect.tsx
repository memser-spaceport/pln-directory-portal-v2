'use client';

/**
 * Multi-select with a checkbox on every option, shared by "Path via" (grouped,
 * see PathViaSelect) and "Industry / Sector" (flat, below).
 *
 * Four settings between them are what stop the menu moving under the pointer when
 * you tick something. They are the whole point of this file:
 *
 *   closeMenuOnSelect={false}     a tick is not "I'm finished"
 *   hideSelectedOptions={false}   the row you just ticked stays where it was —
 *                                 the default removes it, so the list collapses
 *                                 upward and the next row lands under your cursor
 *   controlShouldRenderValue={false}  no chips growing the control, which would
 *                                 push the menu down as you select
 *   blurInputOnSelect={false}     keeps focus and scroll position in the menu
 *
 * The count goes in the placeholder instead of chips, so the control is exactly
 * as tall with five selections as with none.
 */

import Select, {
  components,
  type CSSObjectWithLabel,
  type GroupBase,
  type OptionProps,
  type StylesConfig,
} from 'react-select';
import { Checkbox } from '@/components/common/Checkbox/Checkbox';
import { filterSelectStyles } from '@/components/common/filters/FilterSelect/filterSelectStyles';
import type { Option } from '@/components/form/FormSelect/types';
import { dsIndicators } from './FilterSelectThin';
import s from './PathViaSelect.module.scss';

/**
 * The DS `Checkbox` plus the label, inside react-select's own option wrapper — so
 * highlight, keyboard handling and group structure stay react-select's and only
 * the indicator is ours.
 *
 * The checkbox is `aria-hidden` and non-interactive: the option already carries
 * `role="option"` and `aria-selected`, so a second focusable control inside it
 * would be announced twice and would swallow the click meant for the option.
 */
export function CheckboxOption<Group extends GroupBase<Option>>(props: OptionProps<Option, true, Group>) {
  return (
    <components.Option {...props}>
      <span className={s.optionRow}>
        <span className={s.optionBox} aria-hidden>
          <Checkbox checked={props.isSelected} />
        </span>
        {props.label}
      </span>
    </components.Option>
  );
}

/** The settings above, in one place, for any multi-select in this filter bar. */
export const steadyMenuProps = {
  isMulti: true,
  closeMenuOnSelect: false,
  hideSelectedOptions: false,
  controlShouldRenderValue: false,
  blurInputOnSelect: false,
} as const;

/**
 * Production's filter styles, plus one fix these multi-selects create.
 *
 * `controlShouldRenderValue: false` means the chosen values are never drawn, so
 * react-select falls back to the placeholder — and `filterSelectStyles.placeholder`
 * is `#cbd5e1` at weight 300, i.e. the "nothing here" treatment. Meanwhile
 * `control` keys off `hasValue` and turns the box blue. The result reads as a
 * control that is simultaneously filled and empty.
 *
 * With a selection the summary is a value, so it takes `singleValue`'s own colour
 * and weight. Without one it stays the placeholder it actually is.
 */
const basePlaceholder = filterSelectStyles.placeholder as
  | ((base: CSSObjectWithLabel, state: unknown) => CSSObjectWithLabel)
  | undefined;

export const checkSelectStyles: StylesConfig<Option, true, GroupBase<Option>> = {
  ...(filterSelectStyles as unknown as StylesConfig<Option, true, GroupBase<Option>>),
  placeholder: (base, state) => ({
    ...(basePlaceholder ? basePlaceholder(base, state) : base),
    ...(state.hasValue
      ? { color: 'var(--foreground-brand-primary, #1b4dff)', fontWeight: 400 }
      : {}),
  }),
};

interface Props {
  options: Option[];
  value: string[];
  onChange: (values: string[]) => void;
  /** Shown alone when nothing is picked, and with a count when something is. */
  placeholder: string;
  'aria-label': string;
  isSearchable?: boolean;
}

export function CheckSelect({
  options,
  value,
  onChange,
  placeholder,
  'aria-label': ariaLabel,
  isSearchable = true,
}: Props) {
  const selected = options.filter((opt) => value.includes(opt.value));

  return (
    <Select<Option, true, GroupBase<Option>>
      {...steadyMenuProps}
      aria-label={ariaLabel}
      options={options}
      value={selected}
      onChange={(opts) => onChange([...(opts ?? [])].map((opt) => opt.value))}
      placeholder={value.length > 0 ? `${placeholder} · ${value.length}` : placeholder}
      isClearable
      isSearchable={isSearchable}
      styles={checkSelectStyles}
      components={{ ...dsIndicators, Option: CheckboxOption }}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      noOptionsMessage={() => 'Nothing matches the other filters'}
    />
  );
}
