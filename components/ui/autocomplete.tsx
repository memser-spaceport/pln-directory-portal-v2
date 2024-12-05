'use client';

import { RefObject } from 'react';

export interface OptionsProps {
  label: string;
  value: string;
  logo?: string;
}

interface AutocompleteProps {
  selectedOption: OptionsProps;
  callback: (option: OptionsProps) => void;
  isPaneActive: boolean;
  paneRef: RefObject<HTMLDivElement>;
  inputRef: RefObject<HTMLInputElement>;
  searchResult: OptionsProps[];
  onTextChange: (text: string) => void;
  searchText: string;
  setIsPaneActive: (isActive: boolean) => void;
  required?: boolean;
  placeholder: string;
  iconUrl?: string;
  onInputBlur?: () => void;
  isProcessing?: boolean;
  onClear: any;
  isClear?: boolean;
}

export const Autocomplete = (props: Readonly<AutocompleteProps>) => {
  //props
  const selectedOption = props.selectedOption;
  const isPaneActive = props.isPaneActive;
  const paneRef = props.paneRef;
  const inputRef = props.inputRef;
  const callback = props.callback;
  const searchResult = props.searchResult;
  const setIsPaneActive = props.setIsPaneActive;
  const searchText = props.searchText;
  const onTextChange = props.onTextChange;
  const required = props.required;
  const placeholder = props.placeholder;
  const iconUrl = props.iconUrl;
  const onInputBlur = props.onInputBlur ?? undefined;
  const isProcessing = props?.isProcessing;
  const isClear = props?.isClear ?? false;
  const onClear = props?.onClear;

  //methods
  const onTextInputChange = (e: any) => {
    onTextChange(e.target.value);
  };

  const onItemSelected = (option: OptionsProps) => {
    callback(option);
  };

  const onPaneClick = () => {
    setIsPaneActive(!isPaneActive);
  };

  return (
    <>
      <div ref={paneRef} className={`autocomplete ${required ? 'autocomplete--required' : ''}`}>
        <div onClick={onPaneClick} className="autocomplete__box">
          <div className="autocomplete__img__wrpr">
            <img width={24} height={24} className="autocomplete__img" src={selectedOption?.logo || iconUrl} alt="logo" />
          </div>
          <input placeholder={placeholder} ref={inputRef} value={searchText} className="autocomplete__input" onChange={onTextInputChange} onBlur={onInputBlur} type="text" tabIndex={-1} />

          {isClear && (
            <button className="autocomplete__img__wrpr__clrbtn" onClick={onClear}>
              <img src="/icons/close-gray.svg" />
            </button>
          )}
          <button className="autocomplete__arrow">
            <img height={10} width={10} src="/icons/arrow-down.svg" alt="arrow" />
          </button>
        </div>
        {isPaneActive && (
          <div className="autocomplete__optns__lst">
            {searchResult.length > 0 ? (
              searchResult.map((res) => (
                <button
                  type="button"
                  className="autocomplete__optns__lst__item"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onItemSelected(res);
                  }}
                  key={res.value}
                >
                  <img width={24} height={24} className="autocomplete__optns__lst__logo" src={res?.logo || iconUrl} alt="logo" />
                  <p className="autocomplete__optns__lst__label">{res.label}</p>
                </button>
              ))
            ) : (
              <p className="autocomplete__optns__na">{isProcessing ? <span>Searching</span> : <>No options available</>}</p>
            )}
          </div>
        )}
      </div>
      <style jsx>
        {`
          .autocomplete {
            width: 100%;
            position: relative;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
          }

          .autocomplete__icon {
            background: #e2e8f0;
            border-radius: 4px;
          }

          .autocomplete__box {
            display: flex;
            gap: 8px;
            cursor: pointer;
            padding: 8px 12px;
          }

          .autocomplete--required {
            border: 1px solid #ef4444;
          }

          .autocomplete__img__wrpr {
            display: flex;
            align-items: center;
          }

          .autocomplete__img__wrpr__clrbtn {
            background: none;
            border: none;
            height: 10px;
            margin-top: 2px;
            width: 10px;
          }

          .autocomplete__img {
            border-radius: 50%;
            object-fit: cover;
            object-position: center;
            background-color: #e2e8f0;
          }
          .autocomplete__input {
            width: 100%;
            outline: none;
            border: none;
            font-size: 14px;
            line-height: 24px;
            background-color: white;
            color: black;
          }

          .autocomplete__input::placeholder {
            color: #475569;
          }

          .autocomplete__optns__lst {
            width: 100%;
            position: absolute;
            background-color: white;
            box-shadow: 0px 0px 6px 0px rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            top: 40px;
            left: 0;
            max-height: 180px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            cursor: pointer;
            padding: 12px;
            margin: 5px 0;
            width: 100%;
            z-index: 5;
            gap: 8px;
          }

          .autocomplete__optns__lst ::-webkit-scrollbar {
            width: 4px;
            border-radius: 5px;
          }

          .autocomplete__optns__lst::-webkit-scrollbar-thumb {
            background-color: #94a3b8;
            border-radius: 5px;
          }

          .autocomplete__optns__lst__item {
            width: 100%;
            padding: 1px 0;
            display: flex;
            color: black;
            text-align: left;
            align-items: center;
            background: transparent;
          }

          .autocomplete__arrow {
            background: transparent;
          }

          .autocomplete__optns__lst__item:hover {
            background-color: #156ff70d;
            color: black;
          }

          .autocomplete__optns__lst__logo {
            object-fit: cover;
            border-radius: 4px;
            object-position: center;
            border-radius: 50%;
            margin-bottom: 2px;
            background: #e2e8f0;
          }

          .autocomplete__optns__lst__label {
            font-size: 13px;
            padding: 8px 16px;
          }

          .autocomplete__optns__na {
            width: 100%;
            font-size: 14px;
            padding: 6px 8px;
            font-weight: 400;
            color: black;
          }

          .autocomplete__optns__na__text {
            display: inline-flex;
            font-weight: 700;
            margin-left: 4px;
          }
        `}
      </style>
    </>
  );
};
