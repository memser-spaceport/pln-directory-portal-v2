'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import s from './Composer.module.scss';

type ComposerProps = React.ComponentProps<'textarea'> & {
  onTextSubmit?: () => void;
  onStopStreaming?: () => void;
  /** Thinking: nothing to stop yet, and nothing can be sent. */
  isAnswerLoading?: boolean;
  /** Streaming: the button becomes Stop. */
  isLoadingObject?: boolean;
  /** Accepted for ChatInput parity; the page has no daily limit. */
  isLimitReached?: boolean;
  onSubmit?: () => void;
  /** `home` is the new-chat page's field: two lines tall at rest. */
  size?: 'home' | 'thread';
};

/**
 * The page's question field, redone. Same contract as production's
 * `ChatInput` (a forwarded textarea ref read on submit, `onTextSubmit`,
 * `onStopStreaming`, the two loading flags), so it drops into the new-chat
 * page and into `AnswerPanel` as a straight swap.
 *
 * What changes from `ChatInput`:
 *  - At rest a 1px card border, not the 2px brand ring production shows even
 *    when nobody is typing; the brand edge is the focus state, so it means
 *    something.
 *  - No "Shift + Enter to add new line" hint. It sat inline between the
 *    placeholder and the button, the same weight as both. Enter sends, as in
 *    every chat product, and a newline is the rare case.
 *  - The send is a round button in the field's bottom-right corner with an
 *    arrow, not a square on a grey block with production's search-sparkle
 *    glyph (that mark is AI Search's logo, not a verb). Dimmed until there is
 *    something to send; a square while an answer streams, to stop it.
 */
const Composer = React.forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  {
    className,
    onTextSubmit,
    onStopStreaming,
    isAnswerLoading,
    isLoadingObject,
    isLimitReached: _limit,
    onSubmit: _submit,
    onChange,
    size = 'thread',
    defaultValue,
    ...props
  },
  ref,
) {
  const [hasText, setHasText] = useState(() => String(defaultValue ?? '').trim().length > 0);

  /* The parent clears the textarea directly after sending (production's
     uncontrolled contract), which fires no change event — re-read on input
     and whenever a send finishes. */
  useEffect(() => {
    if (ref && 'current' in ref && ref.current) setHasText(ref.current.value.trim().length > 0);
  }, [ref, isAnswerLoading, isLoadingObject]);

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const streaming = !!isLoadingObject;
  const canSend = hasText && !isAnswerLoading && !streaming;

  return (
    <div className={clsx(s.root, size === 'home' && s.home, className)}>
      <textarea
        {...props}
        ref={ref}
        defaultValue={defaultValue}
        className={s.input}
        onChange={(e) => {
          grow(e.currentTarget);
          setHasText(e.currentTarget.value.trim().length > 0);
          onChange?.(e);
        }}
      />
      {streaming ? (
        <button
          type="button"
          className={clsx(s.send, s.stop)}
          onClick={(e) => {
            e.preventDefault();
            onStopStreaming?.();
          }}
          aria-label="Stop answering"
          title="Stop"
        >
          <span className={s.stopMark} aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          className={s.send}
          disabled={!canSend}
          onClick={(e) => {
            e.preventDefault();
            onTextSubmit?.();
            setHasText(false);
          }}
          aria-label="Send"
          title={isAnswerLoading ? 'Wait for the answer to finish' : 'Send'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 13V3M3.5 7.5 8 3l4.5 4.5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
});

export default Composer;
