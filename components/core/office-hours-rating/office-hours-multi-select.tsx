import { useEffect, useRef, useState } from 'react';

const OfficeHoursMultiSelect = (props: any) => {
  const items = props?.items;
  const selectedItems = [...props?.selectedItems];
  const onItemSelect = props?.onItemSelect;
  const displayKey = props?.displayKey;
  const onMultiSelectedClick = props?.onMultiSelectedClick;
  const side = props?.side;

  const selectedItem = getSelectedItem();

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
    if(onMultiSelectedClick) {
      onMultiSelectedClick();
    }
  };

  function getSelectedItem() {
    if (selectedItems?.length === 1) {
      return selectedItems[0];
    } else if (selectedItems?.length > 1) {
      return `Selected (${selectedItems.length})`;
    }

    return '';
  }

  return (
    <>
      <div className="ohms">
        <div ref={containerRef} className="ohms__selectcon" onClick={onContainerClickHandler}>
          <input readOnly placeholder="Select reason" value={selectedItem} className="ohms__selectcon__selectedoptn"></input>
          <img alt="dropdown" className="ohms__selectcon__dropdown" src="/icons/arrow-down.svg" width={10} height={7} />

          {showOptions && (
            <div className="ohms__optscnt">
              {items?.map((item: any, index: number) => (
                <div key={`${items} + ${index}`} className="ohms__optscnt__optn">
                  <div className="trblesec__didnthpn__optn__chckbox">
                    {selectedItems?.includes(item.name) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOptions(false);
                          onItemSelect(item);
                        }}
                        className="trblesec__techisue__optn__chckbox__sltdbtn"
                      >
                        <img src="/icons/right-white.svg" />
                      </button>
                    )}

                    {!selectedItems?.includes(item?.name) && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowOptions(false);
                          onItemSelect(item);
                        }}
                        className="trblesec__techisue__optn__chckbox__notsltdbtn"
                      ></button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setShowOptions(false);
                      onItemSelect(item);
                    }}
                    type="button"
                    className="ohms__optscnt__optn__name"
                  >
                    {item[displayKey]}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>
        {`
          button {
            background: inherit;
          }
          .ohms {
            position: relative;
          }

          .ohms__selectcon {
            width: 100%;
          }

          .ohms__optscnt {
            width: 100%;
            list-style-type: none;
            border-radius: 8px;
            padding: 8px;
            box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
            z-index: 100;
            overflow-y: auto;
            max-height: 150px;
            position: absolute;
            background: white;
            border: 1px solid lightgrey;
            top: 100%;
            left: 0;
            right: 0;
          }

          .ohms__selectcon__selectedoptn {
            padding: 8px 12px;
            padding-right: 22px;
            min-height: 40px;
            width: 100%;
            font-size: 14px;
            font-weight: 500;
            border-radius: 8px;
            border: 1px solid lightgrey;
            cursor: pointer;
            text-transform: capitalize;
          }

          .trblesec__didnthpn__optn__chckbox {
            height: 20px;
          }

          .trblesec__techisue__optn__chckbox__sltdbtn {
            background-color: #156ff7;
            border-radius: 4px;
            display: flex;
            align-items: center;
            height: 20px;
            width: 20px;
            justify-content: center;
          }

          .trblesec__techisue__optn__chckbox__notsltdbtn {
            border: 1px solid #cbd5e1;
            height: 20px;
            width: 20px;
            border-radius: 4px;
          }

          .ohms__selectcon__dropdown {
            position: absolute;
            cursor: pointer;
            top: 50%;
            transform: translateY(-50%);
            right: 12px;
          }

          .ohms__selectcon__selectedoptn:focus {
            outline: none;
          }

          .ohms__optscnt__optn__name {
            font-size: 14px;
            text-align: left;
          }

          .ohms__optscnt__optn {
            display: flex;
            gap: 6px;
            align-items: center;
            font-size: 14px;
            padding: 4px 8px;
            text-transform: capitalize;
          }
        `}
      </style>
    </>
  );
};

export default OfficeHoursMultiSelect;
