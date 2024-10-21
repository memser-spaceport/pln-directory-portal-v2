import useClickedOutside from '@/hooks/useClickedOutside';
import { useRef, useState } from 'react';

/**
 * AddDropdown component renders a button that toggles a dropdown menu.
 * The dropdown menu allows users to select options related to team management.
 * 
 * @param {Object} props - Component properties.
 * @param {boolean} props.maintainerTeam - Indicates if the maintainer team option should be shown.
 * @param {Function} props.onOpenPopup - Callback function to handle option selection.
 */
export function AddDropdown(props: any) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { maintainerTeam, onOpenPopup } = props;

  // Hook to close dropdown when clicking outside
  useClickedOutside({ ref: dropdownRef, callback: () => setIsDropdownOpen(false) });

  // Toggles the dropdown menu
  const handleAddClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Handles option selection and closes the dropdown
  const handleOptionClick = (option: string) => {
    setIsDropdownOpen(false);
    onOpenPopup(option);
  };

  return (
    <div>
      <button
        type="button"
        ref={dropdownRef}
        className="add-dropdown"
        onClick={handleAddClick}
        data-testid="add-dropdown-button"
      >
        <div className="add-dropdown__icon">
          <img height={16} width={16} src="/icons/add.svg" alt="Add icon" />
        </div>

        <span className="add-dropdown__text">Add</span>

        {isDropdownOpen && (
          <div className="add-dropdown__dropdown-icon">
            <img height={18} width={18} src="/icons/dropdown-blue.svg" alt="Dropdown icon" />
          </div>
        )}

        {isDropdownOpen && (
          <div className="add-dropdown__options" data-testid="dropdown-options">
            {!maintainerTeam && (
              <button
                type="button"
                className="add-dropdown__option"
                onClick={() => handleOptionClick('MaintainingTeam')}
                data-testid="option-maintainer-team"
              >
                Maintainer Team
              </button>
            )}

            <button
              type="button"
              className="add-dropdown__option"
              onClick={() => handleOptionClick('ContributingTeam')}
              data-testid="option-contributing-team"
            >
              Contributing Team
            </button>
          </div>
        )}
      </button>

      <style jsx>
        {`
          .add-dropdown {
            display: flex;
            gap: 4px;
            align-items: center;
            position: relative;
            background-color: inherit;
          }

          .add-dropdown__icon {
            margin-top: 5px;
          }

          .add-dropdown__dropdown-icon {
            margin-top: 6px;
          }

          .add-dropdown__text {
            font-size: 14px;
            font-weight: 500;
            color: #156ff7;
          }

          .add-dropdown__options {
            position: absolute;
            background-color: white;
            border-radius: 4px;
            box-shadow: 0px 2px 6px 0px #0f172a29;
            top: 30px;
            text-align: left;
            right: 0px;
            width: 130px;
          }

          .add-dropdown__option {
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
