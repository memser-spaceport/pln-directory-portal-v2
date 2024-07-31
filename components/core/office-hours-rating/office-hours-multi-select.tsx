import { useEffect, useRef, useState } from 'react';

const OfficeHoursMultiSelect = (props: any) => {
  const items = props?.items;
  const selectedItems = props?.selectedItems;
  const onItemSelect = props?.onItemSelect;
  const displayKey = props?.displayKey;

  const containerRef = useRef<any>(null);
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const onContainerClickHandler = () => {
    setShowOptions(!showOptions);
  };

  return (
    <>
      <div className="ohms">
        <div className="ohms__selectcon"  onClick={onContainerClickHandler}>
          <div className="ohms__selectcon__selectedoptn">
            {selectedItems.length === 0 && <span>Select reason </span>}
            {selectedItems.length === 1 && <span>{selectedItems[0]}</span>}
            {selectedItems.length > 1 && <span>{selectedItems.length} selected</span>}
          </div>
        </div>
        {showOptions && (
          <div className='ohms__optscnt' ref={containerRef}>
            {items?.map((item: any, index: number) => (
              <div key={`${items} + ${index}`} onClick={() => {setShowOptions(false);onItemSelect(item)}} className='ohms__optscnt__optn'>
                <button>{item[displayKey]}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>
        {`

        button {
        background: inherit;}
          .ohms {
            position: relative;
          }

          .ohms__selectcon {
            padding: 0 12px;
            display: flex;
            align-items: center;
            border-radius: 8px;
            height: 40px;
            background: #ffff;
            border: 1px solid #cbd5e1;
            font-size: 14px;
            font-weight: 400;
            line-height: 24px;
            color: #475569;
            cursor: pointer;
          }

          .ohms__optscnt {
          position: absolute;
          background: white;
          border: 1px solid #cbd5e1;
          padding: 10px;
          width: 100%;
          border-radius: 8px;
          z-index: 1;
          }

          .ohms__optscnt__optn {
          }
        `}
      </style>
    </>
  );
};

export default OfficeHoursMultiSelect;
