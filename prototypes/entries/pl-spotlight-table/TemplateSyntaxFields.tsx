'use client';

// Subject and body fields that show `{{variables}}` and `{{#if}}` blocks as
// tinted tokens instead of raw braces.
//
// WHY THESE EXIST INSTEAD OF FormField / FormTextArea
// A `<textarea>` cannot style its own contents — there is no way to paint one
// run of characters differently from another inside a form control. The standard
// answer, and the one used here, is a MIRROR: a div holding the same string with
// the tokens wrapped in spans, positioned exactly under a text field whose own
// text is transparent. You read the div; you type into the field.
//
// That only works if the two lay out identically to the pixel, so this file
// transcribes production's FormTextArea / FormField metrics (padding 10/12,
// 14px/1.5, #455468, the 8px rgba(203,213,225,0.5) border and its focus ring)
// rather than importing them — the mirror needs to set the same values on
// itself, and a class it does not own cannot be relied on to keep them.
//
// THE RULE THAT CONSTRAINS THE STYLING
// Every token style must be metrically neutral. A different font-family, a
// heavier weight or real horizontal padding all change how wide the text runs,
// and the mirror would drift a fraction of a pixel per token until the caret sat
// visibly off the glyph. So tokens get colour, a background and a radius — and
// the padding that makes the background look like a pill is cancelled by an
// equal negative margin, which is a no-op for layout.
//
// This is also why the tokens are NOT monospaced, though Tines and Teachable
// both monospace theirs: their editors are monospace throughout. Ours holds an
// email someone has to read as prose.

import { useEffect, useMemo, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { TEMPLATE_VARIABLES } from './inviteTemplate';

import s from './TemplateSyntaxFields.module.scss';

/**
 * Control tags first, so `{{#if sector_hook}}` is one token rather than being
 * half-matched by the plain-variable branch. The capture group is what makes
 * `String.split` keep the delimiters.
 */
const TOKEN = /(\{\{#if\s+\w+\}\}|\{\{else\}\}|\{\{\/if\}\}|\{\{\w+\}\})/g;

const KNOWN = new Set(TEMPLATE_VARIABLES.map((variable) => variable.key));

type TokenKind = 'control' | 'variable' | 'unknown' | 'text';

function classify(part: string): TokenKind {
  if (!part.startsWith('{{')) return 'text';
  if (part.startsWith('{{#if') || part === '{{else}}' || part === '{{/if}}') return 'control';
  const key = part.slice(2, -2);
  // An unknown name is the failure this whole editor exists to prevent: a
  // mistyped `{{frist_name}}` throws no error, it just ships those two words to
  // someone's inbox. Amber is the only way the author finds out before sending.
  return KNOWN.has(key) ? 'variable' : 'unknown';
}

const CLASS: Record<TokenKind, string | undefined> = {
  control: s.control,
  variable: s.variable,
  unknown: s.unknown,
  text: undefined,
};

/**
 * The mirror.
 *
 * `multiline` appends a trailing newline, because a string ending in "\n" gives
 * a div one less line box than the textarea it stands in for, and the two would
 * then disagree about scroll height at the very bottom of a long template. A
 * single-line input must NOT get one — an extra line box there would push the
 * text off the vertical centre of a 50px field.
 */
function Highlighted({ text, multiline }: { text: string; multiline: boolean }) {
  const parts = useMemo(() => (multiline ? text + '\n' : text).split(TOKEN), [text, multiline]);
  return (
    <>
      {parts.map((part, index) => {
        const kind = classify(part);
        return kind === 'text' ? (
          <span key={index}>{part}</span>
        ) : (
          <span key={index} className={CLASS[kind]}>
            {part}
          </span>
        );
      })}
    </>
  );
}

/** Keeps the mirror's scroll pinned to the field's, including after a chip insert. */
function useScrollSync(text: string) {
  const fieldRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const mirrorRef = useRef<HTMLDivElement | null>(null);

  const sync = () => {
    if (!fieldRef.current || !mirrorRef.current) return;
    mirrorRef.current.scrollTop = fieldRef.current.scrollTop;
    mirrorRef.current.scrollLeft = fieldRef.current.scrollLeft;
  };

  // Inserting a variable moves the caret, which scrolls the field without ever
  // firing `scroll` on the frame React re-renders in.
  useEffect(sync, [text]);

  return { fieldRef, mirrorRef, sync };
}

interface TextAreaProps {
  name: string;
  placeholder: string;
  rows?: number;
  maxLength?: number;
  showCharCount?: boolean;
}

export function TemplateSyntaxTextArea({ name, placeholder, rows = 7, maxLength, showCharCount }: TextAreaProps) {
  const { register, control } = useFormContext();
  const text = (useWatch({ control, name }) as string) ?? '';
  const { fieldRef, mirrorRef, sync } = useScrollSync(text);
  const field = register(name);

  return (
    <>
      <div className={s.box}>
        <div className={`${s.mirror} ${s.areaMetrics}`} ref={mirrorRef} aria-hidden="true">
          <Highlighted text={text} multiline />
        </div>
        <textarea
          {...field}
          ref={(node) => {
            field.ref(node);
            fieldRef.current = node;
          }}
          onScroll={sync}
          // Kept: `insertToken` in EmailTemplateModal finds this element by id to
          // place a token at the caret.
          id={name}
          className={`${s.field} ${s.areaMetrics}`}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          spellCheck
        />
      </div>
      {showCharCount && maxLength != null && (
        <div className={s.counterRow}>
          <span className={s.counter}>
            {text.length} / {maxLength}
          </span>
        </div>
      )}
    </>
  );
}

interface InputProps {
  name: string;
  label: string;
  placeholder: string;
  maxLength?: number;
}

export function TemplateSyntaxInput({ name, label, placeholder, maxLength }: InputProps) {
  const { register, control } = useFormContext();
  const text = (useWatch({ control, name }) as string) ?? '';
  const { fieldRef, mirrorRef, sync } = useScrollSync(text);
  const field = register(name);

  return (
    <div className={s.inputBlock}>
      <label className={s.label} htmlFor={name}>
        {label}
      </label>
      <div className={`${s.box} ${s.boxSingleLine}`}>
        <div className={`${s.mirror} ${s.inputMetrics}`} ref={mirrorRef} aria-hidden="true">
          <Highlighted text={text} multiline={false} />
        </div>
        <input
          {...field}
          ref={(node) => {
            field.ref(node);
            fieldRef.current = node;
          }}
          onScroll={sync}
          id={name}
          className={`${s.field} ${s.inputMetrics}`}
          placeholder={placeholder}
          maxLength={maxLength}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
