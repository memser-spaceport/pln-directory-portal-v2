const FloatingMultiSelect = (props: any) => {
  const items = props.items ?? [];
  const filteredItems = props.filteredItems ?? [];
  const sortedItems = [...filteredItems].sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1));
  const onInputChange = props?.onInputChange;
  const onItemSelected = props?.onItemSelected;
  const selectedItems = props?.selectedItems;
  const onClearSelection = props?.onClearSelection;
  const onFilter = props?.onFilter;
  const onClosePane = props?.onClosePane;
  const setFilteredItems = props?.setFilteredItems;
  const search = props?.search ?? false;

  return (
    <>
      <div className="fms">
        <div className="fms__hdr">
          {`FILTER (${selectedItems?.length})`}
          <button
            className="fms__hdr__clsBtn"
            onClick={(e) => {
              setFilteredItems([...items]);
              onClosePane();
            }}
          >
            <img src="/icons/close.svg" alt="close" width={16} height={16} />
          </button>
        </div>
        {search && <div className="fms__inputCn">
          <div className="cursor-default">
            <img src="/icons/search-gray-v2.svg" alt="search" width={16} height={16} />
          </div>
          <input onChange={(e) => onInputChange(e.target?.value)} className="fms__inputCn__input" placeholder="Search" />
        </div>}
        <div className="fms__body">
          {sortedItems?.map((item: any, index: number) => (
            <div className="fms__body__item" onClick={() => onItemSelected(item)} key={`filter-item-${index}`}>
              <div title={item} className="fms__body__item__txt">
                {item}
              </div>
              <div className={`${selectedItems?.includes(item) ? 'selected__item' : 'unselected__item'}`}>
                <img width={12} height={12} src="/icons/right-white.svg" />
              </div>
            </div>
          ))}
          {sortedItems?.length === 0 && <span className="fms__body__noRes">No Results</span>}
        </div>
        <div className="fms__ftr">
          <div className="fms__ftr__actions">
            <button
              onClick={(e) => {
                onClearSelection(e);
                onFilter([], 'reset');
              }}
              className="fms__ftr__actions__reset"
            >
              Reset
            </button>
            <button onClick={() => onFilter(selectedItems)} className="fms__ftr__actions__apply">
              Apply
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .fms {
          display: flex;
          width: 100%;
          flex-direction: column;
          gap: 10px;
          border-radius: 8px;
          background-color: white;
          padding: 12px 8px 12px 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .fms__hdr__clsBtn {
          background: transparent;
        }

        .fms__hdr {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 400;
          line-height: 1.5rem;
          color: #0f172a;
        }

        .fms__inputCn {
          margin-right: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background-color: white;
          padding-left: 12px;
          padding-right: 12px;
        }

        .fms__inputCn__input {
          width: 100%;
          flex: 1;
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
          border-bottom-left-radius: 8px;
          padding-top: 8px;
          padding-bottom: 8px;
          border: none;
        }

        .fms__inputCn__input::placeholder {
          font-size: 14px;
          font-weight: 500;
          color: #475569;
        }

        .fms__inputCn__input:focus {
          outline: none;
        }

        .fms__ftr {
          border-top: 1px solid #cbd5e1;
        }

        .fms__ftr__actions {
          display: flex;
          justify-content: space-between;
          padding-top: 10px;
        }

        .fms__ftr__actions__reset {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          background: transparent;
        }

        .fms__ftr__actions__apply {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #156ff7;
          background: transparent;
        }

        .fms__body {
          display: flex;
          max-height: 140px;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .fms__body__item {
          display: flex;
          cursor: pointer;
          align-items: center;
          justify-content: space-between;
        }

        .fms__body__item__txt {
          font-size: 14px;
          font-weight: 400;
          color: #0f172a;
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cursor-default {
          cursor: default;
        }

        .selected__item {
          display: flex;
          height: 20px;
          width: 20px;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background-color: #156ff7;
        }

        .unselected__item {
          height: 20px;
          width: 20px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          background-color: white;
        }

        .fms__body__noRes {
          text-align: center;
          font-size: 14px;
          font-weight: 400;
          color: #0f172a;
        }
      `}</style>
    </>
  );
};

export default FloatingMultiSelect;
