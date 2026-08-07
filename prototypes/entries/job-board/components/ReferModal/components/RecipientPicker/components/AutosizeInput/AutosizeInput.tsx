import { type InputHTMLAttributes } from 'react';
import type { GroupBase, InputProps } from 'react-select';

import { RecipientOption } from '../../../../types';

import s from './AutosizeInput.module.scss';

// react-select's own Input auto-sizes via a CSS Grid cell shared between the real
// <input> and an invisible sizer. This is the same idea rebuilt on flexbox:
// `.inputMirror` renders the typed text invisibly so the wrapper's content width
// tracks what's typed, and the real <input> is absolutely positioned over it so it
// always matches. flexGrow on `.inputSizer` (set from `control` in selectStyles.ts
// via `--recipient-input-grow`) is what lets the wrapper claim more than that
// content width once the chip row has room.
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

export function AutosizeInput(props: InputProps<RecipientOption, true, GroupBase<RecipientOption>>) {
  const { innerRef, isDisabled, isHidden, value } = props;

  const domProps = Object.fromEntries(Object.entries(props).filter(([key]) => !INTERNAL_PROP_KEYS.has(key)));

  return (
    <div className={s.inputSizer}>
      <span className={s.inputMirror} aria-hidden="true">
        {`${value ?? ''} `}
      </span>
      <input
        {...(domProps as InputHTMLAttributes<HTMLInputElement>)}
        ref={innerRef}
        disabled={isDisabled}
        className={s.inputField}
        style={{ opacity: isHidden ? 0 : 1 }}
      />
    </div>
  );
}
