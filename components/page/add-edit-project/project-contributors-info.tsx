import useClickedOutside from '@/hooks/useClickedOutside';
import { useRef, useState } from 'react';
import { MaintainingTeamPopup } from './maintaining-team-popup';
import { EVENTS } from '@/utils/constants';
import ContributorsPopup from './contributors-popup';
import Modal from '@/components/core/modal';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';

export default function ProjectContributorsInfo() {
  const dropdownRef = useRef(null);

  const modalRef = useRef<HTMLDialogElement>(null);

  const [selectedMaintainingTeam, setSelectedMaintainingTeam] = useState();
  const [selectedContributingTeams, setSelectedContributingTeams] = useState([]);
  const [selectedContributors, setSelectedContributors] = useState([]);

  const [isDropdown, setIsDropdown] = useState(false);

  useClickedOutside({ ref: dropdownRef, callback: () => setIsDropdown(false) });

  const onDropdownClickHandler = () => {
    setIsDropdown(!isDropdown);
  };

  const onOpenPopup = () => {
    modalRef.current?.showModal();
  };

  const getSelectedTeams = () => {
    if (selectedMaintainingTeam) {
      return [...selectedContributingTeams, selectedMaintainingTeam];
    }
    return [...selectedContributingTeams];
  };

  const onClose = () => {
    if (modalRef.current) {
      modalRef.current.close();
    }
  };

  const onMaintainerTeamChangeClickHandler = () => {
    onOpenPopup();
  }

  return (
    <>
      <div>
        <div>
          Teams
          {selectedMaintainingTeam && <button onClick={onMaintainerTeamChangeClickHandler}>Reload</button>}
          <button onClick={onDropdownClickHandler}>
            {isDropdown && (
              <div>
                {!selectedMaintainingTeam && <button onClick={() => onOpenPopup()}>Maintaining Teams</button>}

                <button>Contributing Teams</button>
              </div>
            )}
            Add
          </button>
        </div>

        <div>
          Members
          <button>Contributtors</button>
        </div>
      </div>

      <Modal modalRef={modalRef} onClose={onClose}>
        <RegsiterFormLoader />
        <MaintainingTeamPopup
          onClose={onClose}
          selectedContributors={selectedContributors}
          setSelectedContributors={setSelectedContributors}
          selectedMaintainingTeam={selectedMaintainingTeam}
          setSelectedMaintainingTeam={setSelectedMaintainingTeam}
          selectedTeams={getSelectedTeams()}
        />
      </Modal>
    </>
  );
}
