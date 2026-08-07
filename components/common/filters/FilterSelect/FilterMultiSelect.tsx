'use client';

import Select, { components, type GroupBase, type OptionProps } from 'react-select';
import { Checkbox } from '@/components/common/Checkbox/Checkbox';
import type { Option } from '@/components/form/FormSelect/types';
import { filterMultiSelectStyles } from './filterSelectStyles';
import s from './FilterMultiSelect.module.scss';

/**
 * Checkbox row inside react-select's own option wrapper, so highlight, keyboard
 * handling, and group structure stay react-select's — only the indicator is ours.
 * `aria-hidden`/non-interactive: the option already carries `role="option"` and
 * `aria-selected`, so a second focusable control would be announced twice and
 * would swallow the click meant for the option.
 */
function CheckboxOption(props: OptionProps<Option, true, GroupBase<Option>>) {
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

/**
 * With `controlShouldRenderValue={false}` the chosen values are never drawn, so
 * react-select falls back to the placeholder — which otherwise keeps the "nothing
 * selected" muted color even once something is picked, while `control`'s own
 * `hasValue`-keyed border still turns blue. Match the summary text's color/weight
 * to a real selection so the control doesn't read as filled-and-empty at once.
 */
const checkboxStyles: typeof filterMultiSelectStyles = {
  ...filterMultiSelectStyles,
  placeholder: (base, state) => ({
    ...(filterMultiSelectStyles.placeholder?.(base, state) ?? base),
    ...(state.hasValue ? { color: '#1b4dff', fontWeight: 400 } : {}),
  }),
  group: (base) => ({ ...base, paddingTop: 4, paddingBottom: 4 }),
  groupHeading: (base) => ({
    ...base,
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'none',
    color: '#8897ae',
    paddingTop: 6,
    paddingBottom: 2,
  }),
};

interface Props {
  /** Flat option list. Mutually exclusive with `groups` — pass one or the other. */
  readonly options?: Option[];
  /** Grouped option list (e.g. "Path type" / "PL member" / "Founder or co-investor"). */
  readonly groups?: GroupBase<Option>[];
  readonly value: Option[];
  readonly onChange: (value: Option[]) => void;
  readonly placeholder?: string;
  readonly isSearchable?: boolean;
  readonly 'aria-label'?: string;
  /**
   * Checkbox-row rendering: the ticked option stays put (`hideSelectedOptions=false`),
   * the control shows a count instead of growing chips (`controlShouldRenderValue=false`),
   * and the menu doesn't close per pick — for filters where the user ticks several
   * boxes in a row and multi-value chips would push the menu around underneath them.
   */
  readonly checkbox?: boolean;
}

export function FilterMultiSelect({
  options,
  groups,
  value,
  onChange,
  placeholder = 'All focus areas',
  isSearchable = false,
  'aria-label': ariaLabel,
  checkbox = false,
}: Props) {
  return (
    <Select<Option, true, GroupBase<Option>>
      isMulti
      inputId={ariaLabel ? undefined : 'filter-multi-select'}
      aria-label={ariaLabel}
      options={groups ?? options}
      value={value}
      onChange={(opts) => onChange([...(opts ?? [])])}
      placeholder={checkbox && value.length > 0 ? `${placeholder} · ${value.length}` : placeholder}
      isClearable
      isSearchable={isSearchable}
      closeMenuOnSelect={!checkbox}
      hideSelectedOptions={!checkbox}
      controlShouldRenderValue={!checkbox}
      blurInputOnSelect={!checkbox}
      styles={checkbox ? checkboxStyles : filterMultiSelectStyles}
      components={checkbox ? { Option: CheckboxOption } : undefined}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      menuPosition="fixed"
      ariaLiveMessages={
        checkbox
          ? {
              onChange: ({ action, label }) =>
                action === 'select-option'
                  ? `${label}, checked.`
                  : action === 'deselect-option'
                    ? `${label}, unchecked.`
                    : '',
            }
          : undefined
      }
    />
  );
}
