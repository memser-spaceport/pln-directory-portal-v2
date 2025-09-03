import { isMobileDevice } from '@/utils/common.utils';
import React from 'react';

const ChatInput = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<'textarea'> & { onSubmit?: () => void; isAnswerLoading?: boolean; isLoadingObject?: boolean; onStopStreaming?: () => void; isLimitReached?: boolean; onTextSubmit?: () => void }
>(({ className, onSubmit, isAnswerLoading, isLoadingObject, onStopStreaming, isLimitReached, onTextSubmit, onChange, ...props }, ref) => {
  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
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
    <>
      <div className={`chat__box ${className || ''}`}>
        <textarea {...props} ref={ref} onChange={handleInput} className="chat__box__search-input" />
        {!isMobileDevice() && (
          <div className="chat__box__search-instruction">
            <p>
              <span className="chat__box__search-instruction__tag">Shift</span> +<span className="chat__box__search-instruction__tag">Enter</span> to add new line
            </p>
          </div>
        )}

        <div className="huskyinput__action">
          {isAnswerLoading ? (
            <button disabled title="Please wait till response is generated." className={`huskyinput__action__submit huskyinput__action__submit--disabled`}>
              {/*<img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />*/}
              <ChatIcon />
            </button>
          ) : isLoadingObject ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onStopStreaming?.();
              }}
              title="Stop"
              className="huskyinput__action__submit huskyinput__action__submit--loading"
            >
              <div className="huskyinput__action__submit__loadingCn" />
            </button>
          ) : isLimitReached ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onTextSubmit?.();
              }}
              className={`huskyinput__action__submit huskyinput__action__submit--disabled`}
            >
              <ChatIcon />
              {/*<img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />*/}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                onTextSubmit?.();
              }}
              title="Submit query"
              className="huskyinput__action__submit"
            >
              <ChatIcon />
              {/*<img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />*/}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .chat__box {
          position: relative;
          width: 100%;
          border-radius: 8px;
          outline: 2px solid rgba(66, 125, 255, 1);
          //box-shadow: 0px 0px 16px 0px #63c1ffb2;
          display: flex;
          align-items: center;
          background: linear-gradient(0deg, rgba(241, 245, 249, 0.3) 0%, rgba(241, 245, 249, 0.3) 100%), #fff;
        }

        .border-y {
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          outline: none;
          border-radius: 0;
          box-shadow: none;
        }

        .chat__box__search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 20px;
        }

        .chat__box__search-input {
          width: 100%;
          border: none;
          outline: none;
          border-radius: 8px;
          padding: 10px 6px 6px 6px;
          margin: 0px 48px 0px 0px;
          resize: none;
          font-family: inherit;
          font-size: 16px;
          line-height: 1.5;
          max-height: 100px;
          min-height: 44px;
        }

        .chat__box__search-instruction {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          right: 90px;
          font-size: 12px;
          color: rgba(100, 116, 139, 1);
          white-space: nowrap;
        }

        .chat__box__search-input:placeholder-shown + .chat__box__search-instruction {
          display: flex;
        }

        .chat__box__search-input:not(:placeholder-shown) + .chat__box__search-instruction {
          display: none;
        }

        .chat__box__search-instruction__tag {
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          margin: 0 2px;
        }

        .chat__box__search-button:hover {
          opacity: 1;
        }

        .huskyinput__action img {
          width: 30px;
          height: 30px;
        }

        .huskyinput__action {
          position: absolute;
          right: 4px;
          transform: translateY(-50%);
          top: 50%;
          //right: 12px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .huskyinput__action__submit--disabled {
          background-color: #94a3b8 !important;
          cursor: not-allowed !important;
        }

        .huskyinput__action__submit--loading {
          background-color: #dbeafe !important;
        }

        .huskyinput__action__submit--loading:hover {
          box-shadow: 0px 4px 8px 0px #5661f640;
          border: 1.5px solid #93c5fd;
        }

        .huskyinput__action__submit {
          display: flex;
          width: 40px;
          height: 40px;
          padding: 5px;
          justify-content: center;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;

          border-radius: 4px;
          border: 0.5px solid #cbd5e1;
          background: #156ff7;
        }
        .huskyinput__action__submit__btn {
          width: 25px;
          height: 25px;
          margin-left: -2px;
        }

        .huskyinput__action__submit__loadingCn {
          background-color: #156ff7;
          border-radius: 1.5px;
          animation: scaleDown 1s infinite alternate ease-in-out;
          width: 12px;
          height: 12px;
        }

        @keyframes scaleDown {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(0.83); /* 10/12 = 0.83 */
          }
        }

        .zindex-1 {
          z-index: 1;
        }

        .chat__box__search-input::placeholder {
          font-size: 14px;
        }

        @media (min-width: 768px) {
          .chat__box__search-input {
            font-size: 14px;
            padding: 24px 30px 5px 16px;
            margin: 0px 58px 0px 0px;
            min-height: 64px;
          }

          .huskyinput__action__submit {
            width: 40px;
            height: 40px;
          }

          .huskyinput__action__submit__btn {
            width: 14px;
            height: 14px;
          }

          .huskyinput__action {
            right: 12px;
          }
        }
      `}</style>
    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;

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
