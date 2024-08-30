'use client';

import { useRef } from 'react';
import { PopoverDp } from '../popover-dp';

function HuskyInputBox(props: any) {
  const onHuskyInput = props.onHuskyInput
  const inputRef = useRef<HTMLDivElement>(null);
  const onSourceSelected = props.onSourceSelected;
  const selectedSource = props.selectedSource;
  const sources = [
    {name: 'All', value: 'none'},
    {name: 'Twitter', value: 'twitter'},
    {name: 'LinkedIn', value: 'linkedin'}
  ]

  const selectedSourceName = sources.find(v => v.value === selectedSource)?.name

  const onTextSubmit = async () => {
    if(inputRef.current) {
      const textValue = inputRef.current.innerText;
      inputRef.current.innerText = '';
      onHuskyInput(textValue);
    }
  }

  const onSourceClicked = (value: string) => {
    onSourceSelected(value)
  }
  
  return (
    <>
      <div className="huskyinput">
        <img width={24} height={24} className="huskyinput__img" src="/images/husky-brain.png" />
        <div className="huskyinput__itemcn">
          {' '}
          <div ref={inputRef} data-placeholder="Ask follow up..." contentEditable={true} className="huskyinput__itemcn__textbox" tabIndex={0}></div>
        </div>
        <div className="huskyinput__action">
          <PopoverDp.Wrapper>
            <div className="huskyinput__action__menu">
              <div className="huskyinput__action__menu__dp">
                <img src="/icons/globe.svg" />
                <p>{selectedSourceName}</p>
              </div>
              <img src="/icons/arrow-up.svg" />
            </div>
            <PopoverDp.Pane position="top">
              <div className='huskyinput__action__pane' style={{ zIndex: 20 }}>
                {sources.map((source: any, index:number) => <div key={`input-source-${index}`} onClick={() => onSourceClicked(source.value)} className='huskyinput__action__pane__item'>{source.name}</div>)}
              </div>
            </PopoverDp.Pane>
          </PopoverDp.Wrapper>
          <div onClick={onTextSubmit} className="huskyinput__action__submit">
            <img src="/icons/send.svg" />
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
          .huskyinput__itemcn {
            width: calc(100% - 192px);
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
           
          }

          .huskyinput__action {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .huskyinput__action__menu {
            width: 104px;
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
          }
          .huskyinput__action__pane {
            padding: 12px 16px;
            width: 128px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .huskyinput__action__pane__item {
           font-size: 14px;
           font-weight: 400;
           cursor: pointer;
          }

          .huskyinput__action__menu__dp {
            display: flex;
            gap: 4px;
          }

          .huskyinput__action__submit {
            height: 40px;
            width: 40px;
            border-radius: 50%;
            background: blue;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
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
        `}
      </style>
    </>
  );
}

export default HuskyInputBox;
