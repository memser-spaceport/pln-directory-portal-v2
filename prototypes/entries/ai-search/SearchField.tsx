'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';

import { CloseIcon } from '@/components/icons';
import { DebouncedInput } from '@/components/core/application-search/components/DebouncedInput';
// The 12px/500 brand text production uses for its AI-panel toggles; the
// field's Clear wears it so both surfaces have one text-button lineage.
import sub from '@/components/core/application-search/components/AiChatPanel/components/ChatSubheader/ChatSubheader.module.scss';

import type { AiSearchScope } from './scope';
import s from './SearchField.module.scss';

interface SearchFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Enter. The keyword popover has no use for it; the AI view asks. */
  onSubmit?: (value: string) => void;
  placeholder: string;
  /** The scope chip, when the field is narrowed to one entity. */
  scope?: AiSearchScope | null;
  onRemoveScope?: () => void;
  /** The dialog's ✕, drawn to the right of the field. Absent when a title row above carries it. */
  onClose?: () => void;
  closeLabel?: string;
  /** The leading mark. The magnifier by default; the AI view wears its own glyph. */
  glyph?: React.ReactNode;
}

/**
 * The one field both search surfaces wear: the keyword popover and the AI
 * view. Two chromes that have to stay in step, so one component.
 *
 * The row IS the field, not a form field inside a padded header: a
 * borderless input with the search glyph on the left, larger type, a hairline
 * under it, and one control on the right (ClickUp, Magnific, Notion, Dovetail,
 * Devin, Supabase, Ferndesk all draw it this way). Production's
 * `DebouncedInput` is still the component — its debounce, Enter/Escape and
 * clear behaviour — restyled through its own `classes` hooks.
 *
 * The trailing control is the word **Clear**, not a ✕: with the dialog's own
 * ✕ beside it, two crosses 12px apart read as one control drawn twice, and
 * the size difference that told them apart was a compensation rather than a
 * distinction. "Clear" is the product's own word for emptying a field
 * (`Clear All` in `FiltersSidePanel`, `aria-label="Clear"` on `FiltersSearch`).
 *
 * The scope chip (Sana's pinned file, Fabric's "Current file") sits over the
 * input's left padding, so the text starts after it — its width depends on
 * the name, so it is measured. Backspace in an empty field removes it, as it
 * removes the last token in every tokenised field.
 */
export function SearchField({
  id,
  value,
  onChange,
  onSubmit,
  placeholder,
  scope,
  onRemoveScope,
  onClose,
  closeLabel,
  glyph,
}: SearchFieldProps) {
  const chipRef = useRef<HTMLSpanElement>(null);
  const [chipWidth, setChipWidth] = useState(0);
  useLayoutEffect(() => {
    setChipWidth(scope && chipRef.current ? chipRef.current.offsetWidth : 0);
  }, [scope]);

  /* `DebouncedInput` flushes its debounce (so `onChange`) before it calls
     `onImplictFlush`, and neither hands the value over — the ref is what the
     flush wrote a tick ago. */
  const latest = useRef(value);
  latest.current = value;

  return (
    <div className={s.headerBar}>
      <div
        className={s.fieldHost}
        style={{ '--scope-chip-width': `${chipWidth}px` } as React.CSSProperties}
        onKeyDown={(e) => {
          const target = e.target as HTMLInputElement;
          if (e.key === 'Backspace' && scope && onRemoveScope && target.id === id && !target.value) onRemoveScope();
        }}
      >
        {scope && (
          <span ref={chipRef} className={s.scopeChip}>
            <img
              className={clsx(s.scopeLogo, scope.kind === 'member' && s.scopeLogoPerson)}
              src={scope.logo}
              alt=""
              width={16}
              height={16}
            />
            <span className={s.scopeName}>About {scope.name}</span>
            {onRemoveScope && (
              <button
                type="button"
                className={s.scopeRemove}
                onClick={onRemoveScope}
                aria-label={`Remove ${scope.name}, ask the whole network`}
              >
                <CloseIcon width={12} height={12} />
              </button>
            )}
          </span>
        )}
        <DebouncedInput
          ids={{ root: `${id}-root`, input: id }}
          value={value}
          onChange={(next) => {
            latest.current = next;
            onChange(next);
          }}
          onImplictFlush={onSubmit ? () => onSubmit(latest.current) : undefined}
          placeholder={placeholder}
          flushIcon={glyph ?? <Image src="/icons/search-right.svg" alt="Search" width={20} height={20} />}
          clearIcon="Clear"
          classes={{
            root: s.fieldRoot,
            input: clsx(s.fieldInput, scope && s.fieldInputScoped),
            flushBtn: s.fieldFlush,
            clearBtn: clsx(sub.button, s.fieldClear),
          }}
        />
      </div>
      {onClose && (
        <button type="button" className={s.close} onClick={onClose} aria-label={closeLabel}>
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
