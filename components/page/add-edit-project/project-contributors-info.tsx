import useClickedOutside from '@/hooks/useClickedOutside';
import { useEffect, useRef, useState } from 'react';
import { MaintainingTeamPopup } from './maintaining-team-popup';
import { EVENTS } from '@/utils/constants';
import ContributorsPopup from './contributors-popup';
import Modal from '@/components/core/modal';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import { getTeamsForProject } from '@/services/teams.service';
import { triggerLoader } from '@/utils/common.utils';
import Toaster from '@/components/core/toaster';
import { toast } from 'react-toastify';
import { getMembersForProjectForm } from '@/services/members.service';
import Contributors from '../project-details/contributors';
import { ContributingTeamPopup } from './contributing-team-popup';

export default function ProjectContributorsInfo() {
  const dropdownRef = useRef(null);

  const maintainingTeamRef = useRef<HTMLDialogElement>(null);
  const contributingTeamRef = useRef<HTMLDialogElement>(null);
  const contributorsPopupRef = useRef<HTMLDialogElement>(null);

  const [selectedMaintainingTeam, setSelectedMaintainingTeam] = useState();
  const [selectedContributingTeams, setSelectedContributingTeams] = useState([]);
  const [selectedContributors, setSelectedContributors] = useState([]);

  const [initialTeams, setInitialTeams] = useState([]);
  const [initialContributors, setInitialContributors] = useState([]);

  const [isDropdown, setIsDropdown] = useState(false);

  useClickedOutside({ ref: dropdownRef, callback: () => setIsDropdown(false) });

  const onDropdownClickHandler = () => {
    setIsDropdown(!isDropdown);
  };

  const onOpenPopup = async (name: string) => {
    if (name === 'MaintainingTeam') {
      maintainingTeamRef.current?.showModal();
    } else if (name === 'ContributingTeam') {
      contributingTeamRef.current?.showModal();
    } else {
      contributorsPopupRef.current?.showModal();
    }
  };

  const getSelectedTeams = () => {
    if (selectedMaintainingTeam) {
      return [...selectedContributingTeams, selectedMaintainingTeam];
    }
    return [...selectedContributingTeams];
  };

  const onClose = () => {
    maintainingTeamRef.current?.close();
    contributingTeamRef.current?.close();
    contributorsPopupRef.current?.close();
  };

  const onMaintainerTeamChangeClickHandler = () => {
    onOpenPopup('MaintainingTeam');
  };

  const getAllTeams = async () => {
    try {
      const result = await getTeamsForProject();
      if (result.isError) {
        return false;
      }
      setInitialTeams(result.data);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getAllContributors = async (teamUid: any) => {
    try {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      const result = await getMembersForProjectForm(teamUid);
      if (result.isError) {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        return false;
      }
      setInitialContributors(result.data);
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));

      return true;
    } catch (e) {
      console.error(e);
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));

      return false;
    }
  };

  useEffect(() => {
    getAllContributors(null);
    getAllTeams();
  }, []);

  return (
    <>
      <div>
        <div>
          Teams
          {selectedMaintainingTeam && <button onClick={onMaintainerTeamChangeClickHandler}>Reload</button>}
          <button onClick={onDropdownClickHandler}>
            {isDropdown && (
              <div>
                {!selectedMaintainingTeam && <button onClick={() => onOpenPopup('MaintainingTeam')}>Maintaining Teams</button>}

                <button onClick={() => onOpenPopup('ContributingTeam')}>Contributing Teams</button>
              </div>
            )}
            Add
          </button>
        </div>

        <div>
          Members
          <button onClick={() => onOpenPopup('Contributors')}>Contributtors</button>
        </div>
      </div>

      <Modal modalRef={maintainingTeamRef} onClose={onClose}>
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

      <Modal modalRef={contributingTeamRef} onClose={onClose}>
        <RegsiterFormLoader />
        <ContributingTeamPopup
          onClose={onClose}
          selectedContributors={selectedContributors}
          setSelectedContributors={setSelectedContributors}
          selectedMaintainingTeam={selectedMaintainingTeam}
          selectedTeams={getSelectedTeams()}
          selectedContributingTeams={selectedContributingTeams}
          setSelectedContributingTeams={setSelectedContributingTeams}
        />
      </Modal>

      <Modal modalRef={contributorsPopupRef} onClose={onClose}>
        <ContributorsPopup
          getAllContributors={getAllContributors}
          contributors={initialContributors}
          allTeams={initialTeams}
          selectedContributors={selectedContributors}
          setSelectedContributors={setSelectedContributors}
          from={'Cotributors'}
        />
        <RegsiterFormLoader />
      </Modal>
    </>
  );
}
