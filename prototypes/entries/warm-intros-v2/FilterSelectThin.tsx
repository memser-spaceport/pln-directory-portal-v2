'use client';

/**
 * The filter selects, with the design system's chevron instead of react-select's.
 *
 * `filterSelectStyles` styles the *container* around the dropdown indicator — its
 * colour (`#1b4dff` with a value, `#455468` without) and its `0 8px` padding — but
 * the glyph inside it is react-select's own built-in caret: a chunky filled wedge
 * on a 20×20 viewBox. Nothing in this codebase drew it; it arrived with the
 * library. Next to 14px text at weight 300–400 it is the heaviest mark in the
 * filter bar.
 *
 * `@/components/icons/ChevronDownIcon` is the house glyph — a hairline chevron on
 * a 16×16 box, `currentColor`, already used elsewhere in the app. Swapping it in
 * is a substitution, not a restyle: you cannot thin a filled path with CSS.
 *
 * Only the glyph changes. Wrapping in `components.DropdownIndicator` keeps
 * react-select's own indicator container, so `filterSelectStyles`' colour and
 * padding rules still apply untouched — including the blue-when-selected state.
 *
 * `FilterSelectThin` is otherwise a verbatim transcription of production's
 * `FilterSelect` (same props, same react-select config, same `filterSelectStyles`,
 * same portal + fixed position). It exists only because `FilterSelect` takes no
 * `components` prop, so the indicator cannot be passed in from outside.
 */

import Select, { components, type DropdownIndicatorProps, type GroupBase } from 'react-select';
import { ChevronDownIcon } from '@/components/icons';
import { filterSelectStyles } from '@/components/common/filters/FilterSelect/filterSelectStyles';
import type { Option } from '@/components/form/FormSelect/types';

function DropdownIndicator<IsMulti extends boolean, Group extends GroupBase<Option>>(
  props: DropdownIndicatorProps<Option, IsMulti, Group>,
) {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDownIcon />
    </components.DropdownIndicator>
  );
}

/** Spread into any local react-select instance to pick up the same chevron. */
export const thinChevron = { DropdownIndicator };

interface Props {
  readonly options: Option[];
  readonly value: Option | null;
  readonly onChange: (value: Option | null) => void;
  readonly placeholder?: string;
  readonly isClearable?: boolean;
  readonly isSearchable?: boolean;
  readonly isDisabled?: boolean;
  readonly 'aria-label'?: string;
  readonly title?: string;
}

export function FilterSelectThin({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  isClearable = false,
  isSearchable = false,
  isDisabled = false,
  'aria-label': ariaLabel,
  title,
}: Props) {
  return (
    <div title={title}>
      <Select
        inputId={ariaLabel ? undefined : 'filter-select'}
        aria-label={ariaLabel}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        isClearable={isClearable}
        isSearchable={isSearchable}
        isDisabled={isDisabled}
        styles={filterSelectStyles}
        components={thinChevron}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        menuPosition="fixed"
      />
    </div>
  );
}
