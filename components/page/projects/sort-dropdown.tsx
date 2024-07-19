
const SortByDropdown = (props: any) => {
  const sortByRef = props.sortByRef;
  const sortBy = props?.sortBy;
  const sortOptions = props?.sortOptions;
  const selectedOption = [...sortOptions].find((item) => item.name === sortBy);
  const onSortItemClick = props.onSortItemClick;
  const onSortClick = props?.onSortClick;
  const isSortOpen = props?.isSortOpen;

  return (
    <>
      <div ref={sortByRef} className="dropdown">
        <button className="dropdown__btn" onClick={onSortClick}>
          <img alt="sort" src={selectedOption?.normalIcon} height={20} width={20} />
          <p className="dropdown__btn__name">{selectedOption?.label}</p>
          <img alt="dropdown" src="/icons/dropdown-gray.svg" />
        </button>
        {isSortOpen && (
          <div className="dropdown__options">
            {sortOptions?.map((option: any, index: number) => (
              <div className="dropdown__option__container" key={`${option} + ${index}`}>
                <button className={`dropdown__option__container__option ${option.name === sortBy ? 'dropdown__option__container__option__selected' : ''}`} onClick={() => onSortItemClick(option)}>
                  <img loading="lazy" src={option?.name === sortBy ? option?.selectedIcon : option?.deselectIcon} height={20} width={20} />
                  {option?.label}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx>
        {`
          .dropdown {
            position: relative;            
          }

          .dropdown__option__container__option {
            padding: 8px 6px 8px 12px;
            display: flex;
            gap: 8px;
            align-items: center;
            background: #fff;
            border: none;
            border-radius: 6px;
            color: #0f172a;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
            width: 100%;
          }

          .dropdown__option__container__option__selected {
            background: #156ff7;
            font-size: 14px;
            font-weight: 500;
            line-height: 20px;
            color: #fff;
          }

          .dropdown__options {
            position: absolute;
            top: 45px;
            left: 0;
            width: 160px;
            display: flex;
            padding: 8px;
            flex-direction: column;
            border-radius: 8px;
            box-shadow: 0px 2px 6px 0px rgba(15, 23, 42, 0.16);
            background: #fff;
          }

          .dropdown__btn {
            display: flex;
            height: 40px;
            padding: 8px 12px;
            align-items: center;
            gap: 8px;
            width: 100%;
            border-radius: 8px;
            background: #fff;
            border: none;
            box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
            border: 1px solid #fff;
          }

          .dropdown__btn:focus {
            border: 1px solid #156ff7;
            box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16), 0px 0px 0px 2px rgba(21, 111, 247, 0.25);
          }

          .dropdown__btn__name {
            color: #0f172a;
            font-size: 15px;
            font-weight: 400;
            line-height: 24px;
          }
        `}
      </style>
    </>
  );
};

export default SortByDropdown;
