'use client';

import { useEffect, useRef, useState } from 'react';
import { PopoverDp } from '../popover-dp';
import { useHuskyAnalytics } from '@/analytics/husky.analytics';

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

  const selectedSourceName = sources.find((v) => v.value === selectedSource)?.name;
  const selectedIcon = sources.find((v) => v.value === selectedSource)?.icon;
  const { trackSourceChange } = useHuskyAnalytics()

  const onTextSubmit = async () => {
    if (isAnswerLoading) {
      return;
    }
   
    if (inputRef.current) {
      if(inputRef.current.innerText.trim() === '') {
        inputRef.current.innerText = '';
        return
      }
      const textValue = inputRef.current.innerText;
      inputRef.current.innerText = '';
      onHuskyInput(textValue);
    }
  };

  const onSourceClicked = (value: string) => {
    trackSourceChange(value);
    onSourceSelected(value);
  };

  useEffect(() => {
    function handler(e: any) {
      if (inputRef.current) {
        inputRef.current.innerText = e?.detail;
      }
    }
    document.addEventListener('husky-ai-input', handler);
    return function () {
      document.removeEventListener('husky-ai-input', handler);
    };
  }, []);

  return (
    <>
      <div className={`huskyinput`}>
        <img width={24} height={24} className="huskyinput__img" src="/images/husky-brain.png" />
        <div className="huskyinput__itemcn">
          {' '}
          <div ref={inputRef} data-placeholder="Ask follow up..." contentEditable={true} className="huskyinput__itemcn__textbox" tabIndex={0}></div>
        </div>
        <div className="huskyinput__action">
          <PopoverDp.Wrapper>
            <div className="huskyinput__action__menu">
              <div className="huskyinput__action__menu__dp">
                <img src={selectedIcon} />
                <p className="huskyinput__action__menu__dp__name">{selectedSourceName}</p>
              </div>
              <img src="/icons/arrow-up.svg" />
            </div>
            <PopoverDp.Pane position="top">
              <div className="huskyinput__action__pane" style={{ zIndex: 20 }}>
                {sources.map((source: any, index: number) => (
                  <div key={`input-source-${index}`} onClick={() => onSourceClicked(source.value)} className="huskyinput__action__pane__item">
                    <img src={source.icon} />
                    <p>{source.name}</p>
                  </div>
                ))}
              </div>
            </PopoverDp.Pane>
          </PopoverDp.Wrapper>
          <div
            onClick={onTextSubmit}
            title={isAnswerLoading ? 'Please wait till response is generated.' : 'Submit query'}
            className={`huskyinput__action__submit ${isAnswerLoading ? 'huskyinput__action__submit--disabled' : ''}`}
          >
            <img className="huskyinput__action__submit__btn" src="/icons/send.svg" />
          </div>
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
            opacity: 0.6;
            cursor: not-allowed;
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
          }
        `}
      </style>
    </>
  );
}

export default HuskyInputBox;
