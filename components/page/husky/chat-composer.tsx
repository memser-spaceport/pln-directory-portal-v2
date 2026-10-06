'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import s from './chat-composer.module.scss';

type ChatComposerProps = React.ComponentProps<'textarea'> & {
  onTextSubmit?: () => void;
  onStopStreaming?: () => void;
  /** Waiting for the answer: nothing to stop yet, and nothing can be sent. */
  isAnswerLoading?: boolean;
  /** Streaming: the send button becomes Stop. */
  isLoadingObject?: boolean;
  /** Kept for parity with `ChatInput`; the parent's submit handler owns the limit check. */
  isLimitReached?: boolean;
  /** `home` is the new-chat page's field: taller at rest. */
  size?: 'home' | 'thread';
};

/**
 * The AI Search question field (LAB-2773, design LAB-2702). Same contract as `ChatInput`
 * (a forwarded textarea ref read on submit, `onTextSubmit`, `onStopStreaming`, the two loading flags).
 *
 * - A card border at rest; the brand edge only on focus.
 * - No "Shift + Enter to add new line" hint.
 * - A round arrow send button, dimmed and disabled while the field is empty; a stop square while streaming.
 */
const ChatComposer = React.forwardRef<HTMLTextAreaElement, ChatComposerProps>(function ChatComposer(
  {
    className,
    onTextSubmit,
    onStopStreaming,
    isAnswerLoading,
    isLoadingObject,
    isLimitReached: _isLimitReached,
    onChange,
    onKeyDown,
    size = 'thread',
    defaultValue,
    ...props
  },
  ref,
) {
  const [hasText, setHasText] = useState(() => String(defaultValue ?? '').trim().length > 0);

  // Parents clear the textarea directly after a send, which fires no change event, so re-read the value.
  const syncHasText = () => {
    if (ref && 'current' in ref && ref.current) {
      setHasText(ref.current.value.trim().length > 0);
    }
  };

  useEffect(() => {
    syncHasText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, isAnswerLoading, isLoadingObject]);

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const isStreaming = !!isLoadingObject;
  const canSend = hasText && !isAnswerLoading && !isStreaming;

  return (
    <div className={clsx(s.root, size === 'home' && s.home, className)} data-testid="chat-composer">
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
        onKeyDown={(e) => {
          onKeyDown?.(e);
          setTimeout(syncHasText, 0);
        }}
      />
      {isStreaming ? (
        <button
          type="button"
          className={clsx(s.send, s.stop)}
          onClick={(e) => {
            e.preventDefault();
            onStopStreaming?.();
          }}
          aria-label="Stop answering"
          title="Stop"
          data-testid="chat-composer-stop"
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
            syncHasText();
          }}
          aria-label="Send"
          title={isAnswerLoading ? 'Please wait till response is generated.' : 'Send'}
          data-testid="chat-composer-send"
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

export default ChatComposer;
