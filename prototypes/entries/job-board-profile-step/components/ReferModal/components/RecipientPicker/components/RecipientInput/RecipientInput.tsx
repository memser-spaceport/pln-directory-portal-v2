import { useState, type FocusEvent, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import type { GroupBase, InputProps } from 'react-select';

import { PlusIcon } from '@/components/icons';

import { RecipientOption } from '../../../../types';

import s from './RecipientInput.module.scss';

// The last line of the recipients field: **Add someone else** at rest, the typing
// line once you press it.
//
// This was `AutosizeInput`: a flexbox rebuild of react-select's CSS-Grid sizer,
// with an invisible mirror span so the wrapper's width tracked what was typed,
// plus `--recipient-input-floor` / `--recipient-input-grow` on the control so the
// field collapsed to 2px at rest and claimed a line when focused. All of that
// existed for one reason — the input had to sit *inline after the last chip* in a
// wrapping row, and share that row without stealing it.
//
// The value is a column of rows now (see `selectStyles.valueContainer`), so the
// input is always the last line and always full width. There is nothing left to
// autosize, and the old floor would have rendered a 2px-wide input at rest with no
// way to click into it.
//
// **Why a button and not just an input.** A bare input at the end of the list is a
// blank strip, so it was carrying a placeholder to stop reading as dead space —
// and placeholder grey is the tone of something inert, on the one line of the
// field that is the only way to add anybody. A labelled control says so instead,
// and costs nothing: pressing it is the press you would have spent clicking into
// the input, and it lands in the same place — focused, menu open, hiring team
// listed. react-select's own control `onMouseDown` does the focusing and opening,
// because the button is inside the control and is not an `<input>`.
//
// The input is never unmounted, only tucked away (`.inputFieldTucked`), so
// react-select's `inputRef` stays live and the focus it moves there on that same
// mousedown has somewhere to land.
//
// Everything react-select threads through this slot besides the fields destructured
// below (cx, getStyles, selectProps, theme, …) is internal to its own default Input
// - not real DOM attributes - so it's filtered out rather than spread onto <input>.
const INTERNAL_PROP_KEYS = new Set([
  'cx',
  'getStyles',
  'getClassNames',
  'getValue',
  'hasValue',
  'isMulti',
  'isRtl',
  'options',
  'selectOption',
  'selectProps',
  'setValue',
  'clearValue',
  'theme',
  'innerRef',
  'isDisabled',
  'isHidden',
  'inputClassName',
  'className',
]);

export function RecipientInput(props: InputProps<RecipientOption, true, GroupBase<RecipientOption>>) {
  const { innerRef, isDisabled, isHidden, hasValue, selectProps } = props;

  /* "Is the field being typed in", tracked here rather than lifted: react-select
     re-renders this slot constantly, and a `components.Input` whose identity
     changed with the state would remount the <input> mid-edit and drop the caret.
     Focus is the honest trigger — pressing the button focuses the input through the
     control, and any other route into the field (a tab, a click on the field's own
     padding) has to open the typing line too, or the keystrokes would land in a
     control nobody can see. */
  const [typing, setTyping] = useState(false);
  const showAddButton = hasValue && !typing;

  const domProps = Object.fromEntries(
    Object.entries(props).filter(([key]) => !INTERNAL_PROP_KEYS.has(key)),
  ) as InputHTMLAttributes<HTMLInputElement>;

  return (
    <div className={s.inputRow}>
      <input
        {...domProps}
        ref={innerRef}
        disabled={isDisabled}
        /* react-select drops the field's own placeholder as soon as a multi-select
           has a value, so the typing line would open blank. Read back off the field
           rather than restated here — it is the same field in the same state, and
           two copies of one string drift. */
        placeholder={hasValue && typeof selectProps.placeholder === 'string' ? selectProps.placeholder : undefined}
        className={clsx(s.inputField, showAddButton && s.inputFieldTucked)}
        style={{ opacity: isHidden ? 0 : 1 }}
        onFocus={(event: FocusEvent<HTMLInputElement>) => {
          setTyping(true);
          domProps.onFocus?.(event);
        }}
        onBlur={(event: FocusEvent<HTMLInputElement>) => {
          setTyping(false);
          domProps.onBlur?.(event);
        }}
      />

      {showAddButton && (
        /* No `onClick`. The control's own mousedown focuses the input and opens the
           menu, and the focus handler above is what swaps this for the typing line —
           so a click handler here would be a second, racing answer to one press.
           `tabIndex={-1}`: tabbing already reaches the input behind it, and a stop
           that only leads to the next stop is a keyboard user pressing Tab twice. */
        <button type="button" className={s.addButton} tabIndex={-1}>
          {/* The plus rides in the avatar's 24px slot, so the row lines up with the
              people above it and reads as the list's last entry rather than a
              control parked under it. Production's own leading-glyph text control
              (`MobileFilterButton`, "＋ Filters") is the same icon in the same job. */}
          <span className={s.addGlyph}>
            <PlusIcon width={16} height={16} />
          </span>
          Add someone else
        </button>
      )}
    </div>
  );
}
