import clsx from 'clsx';
import { forwardRef, ChangeEvent, ComponentProps } from 'react';

import { isMobileDevice } from '@/utils/common.utils';

import s from './ChatInput.module.scss';

export const ChatInput = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<'textarea'> & {
    isAnswerLoading?: boolean;
    isLoadingObject?: boolean;
    onStopStreaming?: () => void;
    isLimitReached?: boolean;
    onTextSubmit?: () => void;
  }
>(
  (
    { className, isAnswerLoading, isLoadingObject, onStopStreaming, isLimitReached, onTextSubmit, onChange, ...props },
    ref,
  ) => {
    const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (onChange) {
        onChange(event);
      }
    };

    const adjustHeight = () => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${ref.current.scrollHeight + 1}px`;
      }
    };

    return (
      <div className={clsx(s.root, className)}>
        <textarea {...props} ref={ref} onChange={handleInput} className={s.input} />
        {!isMobileDevice() && (
          <div className={s.instruction}>
            <p>
              <span className={s.tag}>Shift</span> +<span className={s.tag}>Enter</span> to add new line
            </p>
          </div>
        )}

        <div className={s.action}>
          {isAnswerLoading ? (
            <button
              disabled
              title="Please wait till response is generated."
              className={clsx(s.submit, s.submitDisabled)}
            >
              <ChatIcon />
            </button>
          ) : isLoadingObject ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onStopStreaming?.();
              }}
              title="Stop"
              className={clsx(s.submit, s.submitLoading)}
            >
              <div className={s.loader} />
            </button>
          ) : isLimitReached ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onTextSubmit?.();
              }}
              className={clsx(s.submit, s.submitDisabled)}
            >
              <ChatIcon />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onTextSubmit?.();
              }}
              title="Submit query"
              className={s.submit}
            >
              <ChatIcon />
            </button>
          )}
        </div>
      </div>
    );
  },
);

ChatInput.displayName = 'ChatInput';

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.0902 7.81818C11.4919 7.81818 11.8175 8.14379 11.8175 8.54545V9.63636H12.9084C13.31 9.63636 13.6357 9.96198 13.6357 10.3636C13.6357 10.7653 13.31 11.0909 12.9084 11.0909H11.8175V12.1818C11.8175 12.5835 11.4919 12.9091 11.0902 12.9091C10.6885 12.9091 10.3629 12.5835 10.3629 12.1818V11.0909H9.27202C8.87036 11.0909 8.54474 10.7653 8.54474 10.3636C8.54474 9.96198 8.87036 9.63636 9.27202 9.63636H10.3629V8.54545C10.3629 8.14379 10.6885 7.81818 11.0902 7.81818Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.72656 2C7.0396 2 7.31752 2.20031 7.41651 2.49729L8.1197 4.60686L10.2293 5.31005C10.5263 5.40904 10.7266 5.68696 10.7266 6C10.7266 6.31304 10.5263 6.59096 10.2293 6.68995L8.1197 7.39314L7.41651 9.50271C7.31752 9.79969 7.0396 10 6.72656 10C6.41352 10 6.1356 9.79969 6.03661 9.50271L5.33342 7.39314L3.22385 6.68995C2.92688 6.59096 2.72656 6.31304 2.72656 6C2.72656 5.68696 2.92688 5.40904 3.22385 5.31005L5.33342 4.60686L6.03661 2.49729C6.1356 2.20031 6.41352 2 6.72656 2ZM6.72656 5.02711L6.59833 5.4118C6.52594 5.62897 6.35553 5.79938 6.13836 5.87177L5.75367 6L6.13836 6.12823C6.35553 6.20062 6.52594 6.37103 6.59833 6.5882L6.72656 6.97289L6.85479 6.5882C6.92718 6.37103 7.09759 6.20062 7.31476 6.12823L7.69945 6L7.31476 5.87177C7.09759 5.79938 6.92718 5.62897 6.85479 5.4118L6.72656 5.02711Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.60446 13.8494C7.88848 14.1334 7.88847 14.5939 7.60446 14.8779L4.69537 17.787C4.41135 18.071 3.95087 18.071 3.66685 17.787C3.38283 17.503 3.38283 17.0425 3.66685 16.7585L6.57594 13.8494C6.85996 13.5654 7.32044 13.5654 7.60446 13.8494Z"
      fill="white"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.4684 4.87352C11.5483 4.47989 11.9321 4.22556 12.3258 4.30546C15.1478 4.8783 17.272 7.37208 17.272 10.3636C17.272 13.7778 14.5043 16.5455 11.0902 16.5455C8.39746 16.5455 6.10861 14.8242 5.26032 12.4242C5.12647 12.0455 5.32496 11.63 5.70366 11.4961C6.08236 11.3623 6.49787 11.5608 6.63172 11.9395C7.28103 13.7765 9.03305 15.0909 11.0902 15.0909C13.701 15.0909 15.8175 12.9744 15.8175 10.3636C15.8175 8.07747 14.1939 6.16888 12.0364 5.73094C11.6428 5.65103 11.3885 5.26715 11.4684 4.87352Z"
      fill="white"
    />
  </svg>
);
