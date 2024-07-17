import TextField from '@/components/form/text-field';
import { useEffect, useRef, useState } from 'react';

interface TagsPickerProps {
  selectedItems: any;
  inputValue: string;
  placeholder: string;
  error: any;
  filteredOptions: any;
  onItemsSelected: (value: string) => void;
  onInputChange: (e: any) => void;
  onInputKeyDown: (e: any) => void;
  addCurrentInputValue: () => void;
}

const TagsPicker: React.FC<TagsPickerProps> = ({ selectedItems, inputValue, placeholder, filteredOptions, error, onItemsSelected, onInputChange, onInputKeyDown, addCurrentInputValue }) => {
  //variable
  const [isPaneActive, setIsPaneActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  //method
  const togglePaneStatus = (status: boolean) => {
    setIsPaneActive(status);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsPaneActive(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      <div ref={containerRef} className="picker">
        <div className="picker__cn">
          <input
            className="picker__cn__input"
            onKeyDown={onInputKeyDown}
            onChange={onInputChange}
            onClick={() => togglePaneStatus(true)}
            value={inputValue}
            placeholder={placeholder}
            type="text"
            name="tags"
            id="tag-picker"
          />
          {isPaneActive && (
            <div className="options-shadow picker__cn__options">
              {filteredOptions?.map((item: any, index: number) => (
                <div className="picker__cn__options__item" onClick={() => onItemsSelected(item)} key={`filter-item-${index}`}>
                  <div className={`picker__cn__options__item__check ${selectedItems?.includes(item) ? 'picker__cn__options__item__check--selected' : ''}`}>
                    <img src="/icons/right-white.svg" alt="check" />
                  </div>
                  <div title={item} className="picker__cn__options__item__name">
                    {item}
                  </div>
                </div>
              ))}
              {filteredOptions?.length === 0 && inputValue && (
                <>
                  <div className="picker__cn__options__empty" onClick={addCurrentInputValue}>
                    <img src="/icons/add-tag.svg" alt="plus" />
                    <span>
                      {inputValue} <span className="picker__cn__options__empty__add">(Add New)</span>
                    </span>
                  </div>
                  <p className="picker__cn__options__empty__msg">No results found</p>
                </>
              )}
            </div>
          )}
          {error && <div className="picker__cn__error">{error}</div>}
        </div>
        {selectedItems?.length > 0 && (
          <div className="picker__selected">
            {selectedItems?.map((item: any, index: number) => (
              <div key={index} className="picker__selected__item">
                <div title={item} className="picker__selected__item__name">
                  {item}
                </div>
                <button type="button" onClick={() => onItemsSelected(item)} className="picker__selected__item__btn">
                  <img src="/icons/close-tags.svg" height={10} width={10} alt="close" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx>
        {`
          .picker {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
          }
          .picker__cn {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .picker__cn__input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid lightgrey;
            border-radius: 8px;
            min-height: 40px;
            font-size: 14px;
          }

          .picker__cn__input:focus-visible,
          .picker__cn__input:focus {
            outline: 1px solid #156FF7;
          }
          ::placeholder {
            color: #aab0b8;
          }

          .picker__cn__options {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 16px;
            border-radius: 8px;
            padding: 16px;
            max-height: 190px;
            overflow-y: auto;
          }

          .picker__cn__options__item {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
          }

          .picker__cn__options__item__check {
            height: 20px;
            width: 20px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background-color: #ffffff;
          }

          .picker__cn__options__item__check--selected {
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #156ff7;
            background-color: #156ff7;
          }

          .picker__cn__options__item__name {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #0f172a;
            max-width: 180px;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .picker__selected__item__btn{
            margin-top: 2px;
          }

          .picker__cn__options__empty {
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #0f172a;
          }

          .picker__cn__options__empty__add {
            color: #64748b;
          }

          .picker__cn__options__empty__msg {
            color: #64748b;
          }

          .picker__cn__error {
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: #f97316;
          }

          .picker__selected {
            display: flex;
            align-items: center;
            gap: 4px;
            flex-wrap: wrap;
          }

          .picker__selected__item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 0;
            font-weight: 500;
            font-size: 12px;
            line-height: 14px;
            color: #475569;
            height: 18px;
            padding: 4px;
            background-color: #dbeafe;
            border-radius: 24px;
          }

          .picker__selected__item__name {
            max-width: 250px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .picker__selected__item__delete {
            display: flex;
            align-items: center;
            height: 100%;
          }

          .options-shadow {
            box-shadow: 0px 2px 6px 0px rgba(15, 23, 42, 0.16);
            background: rgba(255, 255, 255, 1);
          }
          ::-webkit-scrollbar {
            width: 6px;
            background: #f7f7f7;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background-color: #cbd5e1;
            border-radius: 10px;
          }
          button{
            background-color: transparent;
          }
        `}
      </style>
    </>
  );
};

export default TagsPicker;
