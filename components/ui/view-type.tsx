import { VIEW_TYPE_OPTIONS } from "@/utils/constants";
import { Tooltip } from "../core/tooltip/tooltip";
import Image from "next/image";

/**
 * Props for the ViewType component.
 * @interface IViewType
 * @property {string} view - The current view type (e.g., GRID or LIST).
 * @property {(viewType: string) => void} callback - Callback to change the view type.
 */
interface IViewType {
  view: string;
  callback: (viewType: string) => void;
}

/**
 * ViewType is a UI component for toggling between grid and list views.
 * It displays two buttons (grid and list) and highlights the selected one.
 *
 * @param {IViewType} props - The props for the component.
 * @returns {JSX.Element} The rendered view type selector.
 */
const ViewType = (props: IViewType) => {
  // Destructure props for clarity
  const view = props?.view;
  const callback = props?.callback;

  return (
    <>
      {/* Container for the view type options */}
      <div className="view-option-container">
        {/* Grid view button with tooltip */}
        <Tooltip
        asChild
          trigger={
            <button className={`view-option-container__grid ${view === VIEW_TYPE_OPTIONS.GRID ? "selected" : "not-selected"}`} onClick={() => callback(VIEW_TYPE_OPTIONS.GRID)}>
              {view === VIEW_TYPE_OPTIONS.GRID ? <Image loading="lazy" alt="grid" src="/icons/grid-selected.svg" width={24} height={24} /> : <Image loading="lazy" alt="grid" src="/icons/grid-deselect.svg" width={24} height={24} />}
            </button>
          }
          content={VIEW_TYPE_OPTIONS.GRID}
        />

        {/* List view button with tooltip */}
        <Tooltip
        asChild
          trigger={
            <button className={`view-option-container__list ${view === VIEW_TYPE_OPTIONS.LIST ? "selected" : "not-selected"}`} onClick={() => callback(VIEW_TYPE_OPTIONS.LIST)}>
              {view === VIEW_TYPE_OPTIONS.LIST ? <Image loading="lazy" alt="grid" src="/icons/list-selected.svg" width={24} height={24} /> : <Image loading="lazy" alt="list" src="/icons/list-deselect.svg" width={24} height={24} />}
            </button>
          }
          content={VIEW_TYPE_OPTIONS.LIST}
        />
      </div>

      <style jsx>
        {`
          .view-option-container {
            box-shadow: 0px 1px 2px 0px rgba(15, 23, 42, 0.16);
            height: 40px;
            display: flex;
            border-radius: 8px;
          }

          .view-option-container__grid {
            height: inherit;
            padding: 8px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            border: none;
            background: #fff;
            border-radius: 8px 0px 0px 8px;
          }

          .view-option-container__list {
            height: inherit;
            padding: 8px;
            display: flex;
            width: 40px;
            height: 40px;
            align-items: center;
            border: none;
            background: #fff;
            border-radius: 0px 8px 8px 0px;
          }

          .selected {
            background: #dbeafe;
            cursor: default;
          }

          .not-selected {
            background: #fff;

            &:hover {
              position: relative;
              z-index: 5;
              box-shadow: 0px 0px 0px 2px #156ff740;
            }
          }
        `}
      </style>
    </>
  );
};

export default ViewType;
