import Modal from '@/components/core/modal';
import { getTeamsForProject } from '@/services/teams.service';
import { triggerLoader } from '@/utils/common.utils';
import { useEffect, useRef, useState } from 'react';
import AllTeams from '../member-details/all-teams';
import { EVENTS } from '@/utils/constants';
import ContributorsPopup from './contributors-popup';
import { getMembersForProjectForm } from '@/services/members.service';
import { IMember } from '@/types/members.types';

export function MaintainingTeamPopup(props: any) {
  const selectedMaintainingTeam = props?.selectedMaintainingTeam;
  const setSelectedMaintainingTeam = props?.setSelectedMaintainingTeam;

  const onClose = props?.onClose;

  const selectedContributors = props?.selectedContributors;
  const setSelectedContributors = props?.setSelectedContributors;

  const [step, setStep] = useState('Teams');
  const [temMaintainingTeam, setTempMaintainingTeam] = useState();

  const selectedTeams = props?.selectedTeams;

  const [teams, setTeams] = useState([]);
  const [allContributors, setAllContributors] = useState<any>([]);

  useEffect(() => {
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    getAllTeams();
  }, []);

  const getAllTeams = async () => {
    try {
      const result = await getTeamsForProject();
      if (result.isError) {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));

        return;
      }
      setTeams(result.data);
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    } catch (error) {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    }
  };

  const onSelectTeamHandler = async (team: any) => {
    setTempMaintainingTeam(team);
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    const members = await getAllContributors(team?.uid);
    setAllContributors(Array.isArray(members) ? members : members);
    setStep('Contributors');
  };


  const getAllContributors = async (selectedTeam: any) => {
    try {
      const result = await getMembersForProjectForm(selectedTeam.uid);
      if (result.isError) {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        return [];
      }
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      return result.data
    } catch (e) {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
      console.error(e);
      return [];
    }
  };

  const onSkipAndSaveClickHandler = () => {
    setSelectedMaintainingTeam(temMaintainingTeam);
    setStep('Teams');
    onClose();
  }

  const onSaveClickHandler = () => {
    setTempMaintainingTeam(temMaintainingTeam);
  }


  return (
    <>
      <div className="mtc">
        {step === 'Teams' && (
          <div>
            <h2>Select contributors</h2>
          </div>
        )}

        {step === 'Teams' && (
          <>
            {teams.length === 0 && <div>No teams found</div>}
            {teams.length > 0 && (
              <>
                {teams.map((team: any, index: number) => (
                  <div key={index}>
                    {team.name}
                    {selectedMaintainingTeam?.uid === team.uid && <button>Selected</button>}
                    {selectedMaintainingTeam?.uid !== team.uid && <button onClick={() => onSelectTeamHandler(team)}>Select</button>}
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {step === 'Contributors' && <ContributorsPopup onSaveClickHandler={onSaveClickHandler} onSkipAndSaveClicked={onSkipAndSaveClickHandler}  setStep={setStep} selectedContributors={selectedContributors} setSelectedContributors={setSelectedContributors}  contributors={allContributors} const from="Teams"/>}
      </div>

      <style jsx>
        {`
          .mtc {
            height: 70vh;
          }

          @media (min-width: 1024px) {
            .mtc {
              width: 665px;
            }
          }
        `}
      </style>
    </>
  );
}
