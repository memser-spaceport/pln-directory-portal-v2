import useClickedOutside from '@/hooks/useClickedOutside';
import { useRef, useState } from 'react';

export function Adddropdown(props: any) {
  const [isDropdown, setIsDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const maintainerTeam = props?.maintainerTeam;
  const onOpenPopup = props?.onOpenPopup;

  useClickedOutside({ ref: dropdownRef, callback: () => setIsDropdown(false) });

  const onAddClickHandler = () => {
    setIsDropdown(!isDropdown);
  };

  const onOptionClick = (option: string) => {
    setIsDropdown(false);
    onOpenPopup(option);
  };

  return (
    <div>
      <button type='button' ref={dropdownRef} className="addDropdown" onClick={onAddClickHandler}>
        <div className="addDropdown__add">
          <img height={16} width={16} src="/icons/add.svg" />
        </div>

        <div className="addDropdown__addTxt">Add</div>

        {isDropdown && (
          <div className="addDropdown__ddownimg">
            <img height={18} width={18} src="/icons/dropdown-blue.svg" />
          </div>
        )}

        {isDropdown && (
          <div className="addDropdown__optns">
            {!maintainerTeam && (
              <button type='button' className="addDropdown__optns__opt" onClick={() => onOptionClick('MaintainingTeam')}>
                Maintainer Team
              </button>
            )}

            <button type='button' className="addDropdown__optns__opt" onClick={() => onOptionClick('ContributingTeam')}>
              Contributing Team
            </button>
          </div>
        )}
      </button>

      <style jsx>
        {`
          .addDropdown {
            display: flex;
            gap: 4px;
            align-items: center;
            position: relative;
            background-color: inherit;
          }

          .addDropdown__add {
            margin-top: 5px;
          }

          .addDropdown__ddownimg {
            margin-top: 6px;
          }

          .addDropdown__addTxt {
            font-size: 14px;
            font-weight: 500;
            color: #156ff7;
          }

          .addDropdown__optns {
            position: absolute;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            top: 30px;
            text-align: left;
            right: 0px;
            width: 130px;
          }

          .addDropdown__optns__opt {
            padding: 10px;
            border-radius: 4px;
            background-color: inherit;
            white-space: nowrap;
            font-size: 13px;
          }
        `}
      </style>
    </div>
  );
}
