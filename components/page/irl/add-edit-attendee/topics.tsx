import HiddenField from '@/components/form/hidden-field';
import TextField from '@/components/form/text-field';
import useTagsPicker from '@/hooks/use-tag-picker';
import { useEffect, useRef, useState } from 'react';

interface ITopicsProps {
  defaultTags: string[];
  selectedItems: string[];
}

const Topics = (props: ITopicsProps ) => {
  const [isPaneActive, setIsPaneActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultTags= props?.defaultTags;
  const allSelectedItems = props?.selectedItems ?? [];

  const topicsProps = useTagsPicker({
    defaultTags,
    selectedItems: allSelectedItems ,
  });


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
      <div  className="picker">
        <div className='picker__ttlcnt'>
            <p>Select topics of interest</p>
        </div>
        <div className="picker__cn" ref={containerRef}>
          <input
            className="picker__cn__input"
            onKeyDown={topicsProps?.onInputKeyDown}
            onChange={topicsProps?.onInputChange}
            onClick={() => togglePaneStatus(true)}
            value={topicsProps?.inputValue}
            placeholder={"Search to add topics"}
            type="text"
            id="tag-picker"
          />
          {isPaneActive && (
            <div className="options-shadow picker__cn__options">
              {topicsProps?.filteredOptions?.map((item: string, index: number) => (
                <div className="picker__cn__options__item" onClick={() => topicsProps?.onItemSelected(item)} key={`filter-item-${index}`}>
                  <div className={`picker__cn__options__item__check ${topicsProps.selectedItems?.includes(item) ? 'picker__cn__options__item__check--selected' : ''}`}>
                    <img src="/icons/right-white.svg" alt="check" />
                  </div>
                  <div title={item} className="picker__cn__options__item__name">
                    {item}
                  </div>
                </div>
              ))}
              {topicsProps?.filteredOptions?.length === 0 && topicsProps?.inputValue && (
                <>
                  <div className="picker__cn__options__empty" onClick={topicsProps?.addCurrentInputValue}>
                    <img src="/icons/add-tag.svg" alt="plus" />
                    <span className='picker__cn__options__empty__vle'>
                      {topicsProps?.inputValue} <span className="picker__cn__options__empty__add">(Add New)</span>
                    </span>
                  </div>
                  <p className="picker__cn__options__empty__msg">No results found</p>
                </>
              )}
            </div>
          )}
        </div>
        {topicsProps.selectedItems?.length > 0 && (
          <div className="picker__selected">
            {topicsProps?.selectedItems?.map((item: string, index: number) => (
              <div key={index} className="picker__selected__item">
                <div title={item} className="picker__selected__item__name">
                  {item}
                </div>
                <button type="button" onClick={() => topicsProps?.onItemSelected(item)} className="picker__selected__item__btn">
                  <img src="/icons/close-tags.svg" height={10} width={10} alt="close" />
                </button>
                <HiddenField defaultValue={item} value={item} name={`topics-${index}`} />
              </div>
            ))}
          </div>
        )}
        
      </div>
      <style jsx>
        {`
          .picker {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 12px;
            position: relative;
          }
          .picker__cn {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .picker__ttlcnt {
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          
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

          .picker__cn__options__empty__vle {
          word-break: break-word;
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

export default Topics;