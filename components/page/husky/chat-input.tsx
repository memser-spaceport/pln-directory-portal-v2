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
              <img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />
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
              <img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />
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
              <img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .chat__box {
          position: relative;
          width: 100%;
          background: white;
          border-radius: 8px;
          outline: 2px solid rgba(66, 125, 255, 1);
          box-shadow: 0px 0px 16px 0px #63c1ffb2;
          display: flex;
          align-items: center;
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
          right: 12px;
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
          width: 32px;
          height: 32px;
          background: blue;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 50%;
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
        }
      `}</style>
    </>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
