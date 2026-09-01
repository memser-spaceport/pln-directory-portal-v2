'use client';

import { useState } from 'react';
import { Field } from '@base-ui-components/react/field';
import clsx from 'clsx';
import { uniq } from 'lodash';
import { useFormContext } from 'react-hook-form';

import { CloseIcon } from '@/components/icons';
// Chrome is production's own `FormTagsInput` stylesheet, imported rather than
// re-typed — 50px field, 33px chip, 6px radius, the lot. Only the ✕ changes.
import s from '@/components/form/FormTagsInput/FormTagsInput.module.scss';

import t from './SkillsTagsInput.module.scss';

interface SkillsTagsInputProps {
  name: string;
  selectLabel: string;
  placeholder?: string;
}

/**
 * `FormTagsInput`, transcribed, with one deliberate substitution: the chip's ✕.
 *
 * Production's tags input draws its remove glyph with react-select's bundled
 * `CrossIcon` — a *filled* heavy cross that inherits the chip's near-black text.
 * Every other ✕ in this flow (the Refer modal's recipient chips, the clear
 * indicator, the modal header) is the DS `CloseIcon`: a 1.5px stroked ✕ taking
 * its tone from `currentColor`, rendered muted grey. Two glyphs for one action,
 * one screen apart, reads as two different controls.
 *
 * So the markup, the handlers, and the stylesheet are production's verbatim;
 * only the icon component and its colour are prototype-local. Nothing outside
 * `prototypes/` is touched — the swap lives here, not in the shared component.
 */
export function SkillsTagsInput({ name, selectLabel, placeholder = 'Add keyword' }: SkillsTagsInputProps) {
  const [inputText, setInputText] = useState('');
  const {
    setValue,
    getValues,
    formState: { errors },
  } = useFormContext();
  const val = (getValues()[name] as string[]) ?? [];

  const commit = (text: string) => {
    const parsed = text
      .trim()
      .split(',')
      .map((i) => i.trim())
      .filter(Boolean);

    if (parsed.length === 0) return;

    setValue(name, uniq([...val, ...parsed]), { shouldValidate: true, shouldDirty: true });
    setInputText('');
  };

  return (
    <div className={s.Content}>
      <div className={s.inputLabel}>{selectLabel}</div>
      <div className={clsx(s.input, { [s.error]: errors[name] })}>
        <div className={s.inputContent}>
          {val.map((item) => (
            <div key={item} className={clsx(s.badge, t.badge)}>
              <span title={item}>{item}</span>{' '}
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() =>
                  setValue(
                    name,
                    val.filter((i) => i !== item),
                    { shouldValidate: true, shouldDirty: true },
                  )
                }
              >
                {/* Sized and toned like the Refer modal's chip ✕. */}
                <CloseIcon width={14} height={14} />
              </button>
            </div>
          ))}
          <Field.Control
            placeholder={val.length > 0 ? '' : placeholder}
            className={clsx(s.textInput, { [s.hidePlaceholder]: val.length > 0 })}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onBlur={() => {
              if (inputText.trim() === '' || val.includes(inputText.trim())) return;
              commit(inputText);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setInputText('');
                return;
              }

              if (event.key === 'Backspace' && inputText === '' && val.length > 0) {
                setValue(name, val.slice(0, -1), { shouldValidate: true, shouldDirty: true });
                return;
              }

              if (event.key === 'Enter') {
                commit(inputText);
              }
            }}
          />
        </div>
        {inputText.trim() !== '' && (
          <button type="button" className={s.addButton} onClick={() => commit(inputText)}>
            <PlusIcon />
          </button>
        )}
      </div>
    </div>
  );
}

// Production's own add glyph, copied verbatim so the two ends of the field stay
// the same pair of icons they are today.
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M14.25 8C14.25 8.19891 14.171 8.38968 14.0303 8.53033C13.8897 8.67098 13.6989 8.75 13.5 8.75H8.75V13.5C8.75 13.6989 8.67098 13.8897 8.53033 14.0303C8.38968 14.171 8.19891 14.25 8 14.25C7.80109 14.25 7.61032 14.171 7.46967 14.0303C7.32902 13.8897 7.25 13.6989 7.25 13.5V8.75H2.5C2.30109 8.75 2.11032 8.67098 1.96967 8.53033C1.82902 8.38968 1.75 8.19891 1.75 8C1.75 7.80109 1.82902 7.61032 1.96967 7.46967C2.11032 7.32902 2.30109 7.25 2.5 7.25H7.25V2.5C7.25 2.30109 7.32902 2.11032 7.46967 1.96967C7.61032 1.82902 7.80109 1.75 8 1.75C8.19891 1.75 8.38968 1.82902 8.53033 1.96967C8.67098 2.11032 8.75 2.30109 8.75 2.5V7.25H13.5C13.6989 7.25 13.8897 7.32902 14.0303 7.46967C14.171 7.61032 14.25 7.80109 14.25 8Z"
      fill="#8897AE"
    />
  </svg>
);
