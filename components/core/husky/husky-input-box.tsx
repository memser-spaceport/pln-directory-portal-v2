'use client';

import { useEffect, useRef } from 'react';
import { PopoverDp } from '../popover-dp';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';

// This component represents an input box for the Husky application, allowing users to submit queries and select sources.

function HuskyInputBox(props: any) {
  const onHuskyInput = props.onHuskyInput;
  const inputRef = useRef<HTMLDivElement>(null);
  const onSourceSelected = props.onSourceSelected;
  const isAnswerLoading = props.isAnswerLoading;
  const selectedSource = props.selectedSource;
  const sources = [
    { name: 'Others', value: 'none', icon: '/icons/globe.svg' },
    { name: 'Twitter', value: 'twitter', icon: '/icons/social-x.svg' },
    /* { name: 'LinkedIn', value: 'linkedin', icon: '/icons/social-linkedin.svg' }, */
  ];
  const isLimitReached = props?.isLimitReached;
  const selectedSourceName = sources.find((v) => v.value === selectedSource)?.name;
  const selectedIcon = sources.find((v) => v.value === selectedSource)?.icon;
  const { trackSourceChange, trackHuskyChatStopBtnClicked } = useHuskyAnalytics();

  const isLoadingObject = props?.isLoadingObject;
  const stopStreaming = props.stop;
  const question = props?.question ?? ''
  const isLoadingObjectRef = useRef(isLoadingObject);


  // Handles the submission of text input
  const onTextSubmit = async () => {
    if (isAnswerLoading || isLoadingObjectRef.current) {
      return;
    }

    if (inputRef.current) {
      if (inputRef.current.innerText.trim() === '') {
        inputRef.current.innerText = '';
        return;
      }
      const textValue = inputRef.current.innerText;
      inputRef.current.innerText = '';
      onHuskyInput(textValue);
    }
  };

  // Handles the selection of a source
  const onSourceClicked = (value: string) => {
    trackSourceChange(value);
    onSourceSelected(value);
  };

  // Checks if the device is mobile
  const isMobileDevice = () => {
    return /Mobi|Android/i.test(navigator.userAgent);
  };

  const onStopStreaming = () => {
    trackHuskyChatStopBtnClicked(question)
    stopStreaming();
  }

  useEffect(() => {
    // Handles keydown events for input submission
    const handleKeyDown = (event: KeyboardEvent) => {
      if (inputRef.current) {
        const isMobile = isMobileDevice();
        if (event.key === 'Enter') {
          if (isMobile || event.shiftKey) {
            // Allow new line on mobile or with Shift + Enter on desktop
            document.execCommand('insertLineBreak');
            event.preventDefault();
          } else {
            // Submit on Enter on desktop
            event.preventDefault();
            onTextSubmit();
          }
        }
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isAnswerLoading]);

  useEffect(() => {
    const handler = (e: any) => {
      const question = e.detail;
      if (inputRef.current) {
        inputRef.current.innerText = question;
        const editableDiv = inputRef.current;
        editableDiv.focus();

        // Position the caret at the end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editableDiv);
        range.collapse(false);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    };

    document.addEventListener('husky-ai-input', handler);
    return () => {
      document.removeEventListener('husky-ai-input', handler);
    };
  }, []);

  useEffect(() => {
    isLoadingObjectRef.current = isLoadingObject;
  }, [isLoadingObject]);

  return (
    <>
      <div className={`huskyinput`} data-testid="husky-input-box">
        <img width={24} height={24} className="huskyinput__img" src="/images/husky-brain.png" alt="Husky Brain" />
        <div className="huskyinput__itemcn" data-testid="husky-input-container">
          <div ref={inputRef} data-placeholder="Ask a follow up..." contentEditable={true} className="huskyinput__itemcn__textbox" tabIndex={0} data-testid="husky-input-textbox"></div>
          {!isMobileDevice() && (
            <div className="huskyinput__itemcn__instruction">
              <p>
                <span className="huskyinput__itemcn__instruction__tag">Shift</span> + <span className="huskyinput__itemcn__instruction__tag">Enter</span> for new line
              </p>
            </div>
          )}
        </div>
        <div className="huskyinput__action">
          {isAnswerLoading ? (
            <div onClick={onTextSubmit} title="Please wait till response is generated." className={`huskyinput__action__submit huskyinput__action__submit--disabled`}>
            <img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />
          </div>
          ) : isLoadingObject ? (
            <button onClick={onStopStreaming} title="Stop" className="huskyinput__action__submit huskyinput__action__submit--loading">
                <div className="huskyinput__action__submit__loadingCn" />
            </button>
          ) : isLimitReached ? (
            <div onClick={onTextSubmit} className={`huskyinput__action__submit huskyinput__action__submit--disabled`}>
              <img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />
            </div>
          ) : (
            <div onClick={onTextSubmit} title="Submit query" className="huskyinput__action__submit">
              <img className="huskyinput__action__submit__btn" src="/icons/send.svg" alt="Send" />
            </div>
          )}
        </div>
      </div>
      <style jsx>
        {`
          .huskyinput {
            width: 100%;
            padding: 0 16px;
            display: flex;
            gap: 8px;
            align-items: center;
            position: relative;
          }

          .huskyinput::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: transparent;
            transition: background-color 0.3s ease;
          }
          .huskyinput__itemcn {
            width: calc(100% - 104px);
            overflow-y: scroll;
            min-height: 64px;
            max-height: 100px;
            display: flex;
            align-items: center;
          }
          .huskyinput__itemcn__textbox {
            border: none;
            outline: none;
            font-size: 14px;
            line-height: 16px;
            width: 100%;
            max-height: 100px;
          }
          .huskyinput:has(.huskyinput__itemcn__textbox:not(:empty))::before {
            background-color: #c0deff;
            animation: pulse 1.5s infinite;
          }

          @keyframes pulse {
            0% {
              box-shadow: 0 0 5px rgba(0, 123, 255, 0.6);
            }
            50% {
              box-shadow: 0 0 15px rgba(0, 123, 255, 0.8);
            }
            100% {
              box-shadow: 0 0 5px rgba(0, 123, 255, 0.6);
            }
          }

          .huskyinput__action {
            display: flex;
            gap: 8px;
            align-items: center;
            position: relative;
          }
          .huskyinput__itemcn__instruction {
            display: none;
          }

          .huskyinput__itemcn__instruction__tag {
            border: 1px solid #cbd5e1;
            padding: 2px 4px;
            border-radius: 4px;
          }

          .huskyinput__action__menu {
            width: fit-content;
            height: 32px;
            background: #f1f5f9;
            border-radius: 26px;
            color: #0f172a;
            display: flex;
            font-size: 14px;
            align-items: center;
            justify-content: space-between;
            padding: 6px 12px;
            cursor: pointer;
            gap: 4px;
          }
          .huskyinput__action__pane {
            padding: 12px 16px;
            width: 100px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .huskyinput__action__pane__item {
            font-size: 14px;
            font-weight: 400;
            cursor: pointer;
            display: flex;
            gap: 4px;
          }

          .huskyinput__action__menu__dp {
            display: flex;
            gap: 4px;
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
            height: 30px;
            width: 30px;
            border-radius: 50%;
            background: blue;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
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

          [contenteditable='true']:empty:before {
            content: attr(data-placeholder);
            pointer-events: none;
            color: grey;
            font-size: 14px;
            line-height: 14px;
            overflow: hidden;
            display: block; /* For Firefox */
          }
          .huskyinput__action__menu__dp__name {
            display: none;
          }
          @media (min-width: 1024px) {
            .huskyinput__action__menu__dp__name {
              display: block;
            }
            .huskyinput__action__menu {
              width: 113px;
            }
            .huskyinput__action__submit {
              height: 40px;
              width: 40px;
            }
            .huskyinput__action__submit__btn {
              width: 30px;
              height: 30px;
              margin-left: -3px;
            }
            .huskyinput__itemcn__instruction {
              position: absolute;
              top: 0px;
              right: 108px;
              width: 180px;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              color: #64748b;
            }
            .huskyinput__itemcn__instruction {
              display: none;
            }
            .huskyinput__itemcn__textbox:empty + .huskyinput__itemcn__instruction {
              display: flex;
            }
          }
        `}
      </style>
    </>
  );
}

export default HuskyInputBox;
