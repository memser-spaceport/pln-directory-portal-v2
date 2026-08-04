'use client';

/**
 * The design system's search field, with an id and a label.
 *
 * `components/common/filters/SearchInput` is the DS component and this renders
 * exactly what it renders — same `DebouncedInput`, same four class overrides from
 * `SearchInput.module.scss`, same `SearchIcon`/`CloseIcon`. Only two things
 * change, and both are defects rather than taste:
 *
 * 1. **It emits `id=""`.** `SearchInput` passes `ids={{ root: '', input: '' }}`,
 *    and `DebouncedInput` resolves that with `ids?.input ?? 'application-search-input'`.
 *    `??` only falls back on null/undefined, so an empty string passes straight
 *    through: the root and the input both get an empty `id` attribute. That is
 *    invalid HTML, it puts two elements on the page sharing one id, and it leaves
 *    nothing for a `<label for>` to point at.
 * 2. **It has no accessible name.** `SearchInput` takes no `aria-label` and
 *    `DebouncedInput` does not accept one either, so the field is announced with
 *    nothing but its placeholder — and a placeholder is not a label, since it
 *    disappears the moment you type.
 *
 * Both belong to the DS, not to this prototype — worth raising with dev rather
 * than living with. A real `<label>` is used rather than `aria-label` because it
 * also gives the field a click target, and because a visible-to-AT label survives
 * translation tooling that `aria-label` often doesn't.
 *
 * Not fixable from here: `DebouncedInput` also hardcodes `application-search-flush`
 * and `application-search-clear` on its two buttons with no override, so those
 * still collide with the navbar's search on any page carrying both. Same root
 * cause as (1) — the component assumes it is the only one on the page.
 */

import { CloseIcon, SearchIcon } from '@/components/icons';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
import ds from '@/components/common/filters/SearchInput/SearchInput.module.scss';
import f from './FilterBar.module.scss';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** The accessible name. Rendered as a real label, hidden visually. */
  label: string;
  id?: string;
}

export function SearchField({ value, onChange, placeholder, label, id = 'warm-intros-search' }: Props) {
  return (
    <>
      <label htmlFor={id} className={f.srOnly}>
        {label}
      </label>
      <DebouncedInput
        value={value}
        ids={{ root: `${id}-root`, input: id }}
        classes={{
          root: ds.root,
          input: ds.input,
          flushBtn: ds.flushBtn,
          clearBtn: ds.clearBtn,
        }}
        onChange={onChange}
        placeholder={placeholder}
        hideFlushIconOnValueInput
        clearIcon={<CloseIcon color="#64748b" />}
        flushIcon={<SearchIcon color="#64748b" className={ds.searchIcon} />}
      />
    </>
  );
}
