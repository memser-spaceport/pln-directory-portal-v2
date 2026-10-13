'use client';

import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import s from './chat-composer.module.scss';

type ChatComposerProps = React.ComponentProps<'textarea'> & {
  onTextSubmit?: () => void;
  onStopStreaming?: () => void;
  isAnswerLoading?: boolean;
  isLoadingObject?: boolean;
  size?: 'home' | 'thread';
};

const ChatComposer = React.forwardRef<HTMLTextAreaElement, ChatComposerProps>(function ChatComposer(
  {
    className,
    onTextSubmit,
    onStopStreaming,
    isAnswerLoading,
    isLoadingObject,
    onChange,
    onKeyDown,
    onFocus,
    size = 'thread',
    defaultValue,
    ...props
  },
  ref,
) {
  const [hasText, setHasText] = useState(() => String(defaultValue ?? '').trim().length > 0);

  // Parents write the textarea directly (clear after a send, fill on question edit), which fires no change
  // event, so re-read the value. An empty field also drops the height it grew to.
  const syncHasText = () => {
    if (ref && 'current' in ref && ref.current) {
      const el = ref.current;
      if (!el.value) {
        el.style.height = '';
      }
      setHasText(el.value.trim().length > 0);
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

  // While the answer is still pending there is nothing to stop yet, so the send button stays, disabled.
  const isStreaming = !!isLoadingObject && !isAnswerLoading;
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
          syncHasText();
        }}
        onFocus={(e) => {
          onFocus?.(e);
          syncHasText();
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
