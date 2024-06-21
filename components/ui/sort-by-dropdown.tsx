import { SORT_ICONS } from "@/utils/constants";

interface ISortByDrodown {
  selectedItem: string;
  callback: (type: string) => void
}
const SortByDropdown = (props:ISortByDrodown ) => {
  const selectedItem = props?.selectedItem;
  const callback = props?.callback;

  return (
    <>
      <div className="dropdown">
        {SORT_ICONS?.map((option: any, index: number) => (
          <div className="dropdown__option__container" key={`${option} + ${index}`}>
            <button className={`dropdown__option__container__option ${option.name === selectedItem ? "dropdown__option__container__option__selected" : ""}`} onClick={() => callback(option?.name)}>
              <img loading="lazy" src={option?.name === selectedItem ? option?.selectedIcon : option?.deselectIcon} height={20} width={20} />
              {option?.label}
            </button>
          </div>
        ))}
      </div>
      <style jsx>
        {`
          .dropdown {
            display: flex;
            padding: 8px;
            flex-direction: column;
            border-radius: 8px;
            width: 160px;
            background: #fff;
            box-shadow: 0px 2px 6px 0px rgba(15, 23, 42, 0.16);
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
        `}
      </style>
    </>
  );
};

export default SortByDropdown;
