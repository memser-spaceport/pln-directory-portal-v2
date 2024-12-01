import Modal from '@/components/core/modal';
import RegsiterFormLoader from '@/components/core/register/register-form-loader';
import { getMembersForProjectForm } from '@/services/members.service';
import { getTeamsForProject } from '@/services/teams.service';
import { EVENTS, PAGE_ROUTES } from '@/utils/constants';
import { useEffect, useRef, useState } from 'react';
import { AddDropdown } from './add-drop-down';
import { ContributingTeamPopup } from './contributing-team-popup';
import ContributorsPopup from './contributors-popup';
import { MaintainingTeamPopup } from './maintaining-team-popup';
import HiddenField from '@/components/form/hidden-field';
import { IProjectResponse } from '@/types/project.types';
import { ITeam } from '@/types/teams.types';
import { IMemberResponse } from '@/types/members.types';

export interface IProjectContributorsInfo {
  project: IProjectResponse;
  errors: string[];
}

export default function ProjectContributorsInfo(props: IProjectContributorsInfo) {
  const maintainingTeamRef = useRef<HTMLDialogElement>(null);
  const contributingTeamRef = useRef<HTMLDialogElement>(null);
  const contributorsPopupRef = useRef<HTMLDialogElement>(null);

  const project = props?.project;

  const [selectedMaintainingTeam, setSelectedMaintainingTeam] = useState<any>(project?.maintainingTeam ?? project.maintainingTeam);
  const [selectedContributingTeams, setSelectedContributingTeams] = useState(project.contributingTeams ? project.contributingTeams : []);
  const [selectedContributors, setSelectedContributors] = useState(project.contributions ? project.contributions : []);

  const [initialTeams, setInitialTeams] = useState([]);
  const [initialContributors, setInitialContributors] = useState([]);

  const errors = props?.errors;

  const onOpenPopup = async (name: string) => {
    if (name === 'MaintainingTeam') {
      maintainingTeamRef.current?.showModal();
    } else if (name === 'ContributingTeam') {
      contributingTeamRef.current?.showModal();
    } else if (name === 'Contributors') {
      document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_SELECTED_CONTRIBUTORS, { detail: selectedContributors }));
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
    document.dispatchEvent(new CustomEvent(EVENTS.PROJECT_ADD_MODAL_CLOSE_EVENT, { detail: true }));
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
      result.data.forEach((user: any) => {
        user.teamMemberRoles.forEach((role:any) => {
          if (role.role === null) {
            role.role = "Contributor";
          }
        });
      });
      setInitialContributors(result.data);
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));

      return true;
    } catch (e) {
      console.error(e);
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));

      return false;
    }
  };

  const onDeleteContributingTeam = (team: any) => {
    const filteredTeams = [...selectedContributingTeams].filter((data: any) => data.uid !== team.uid);
    document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_SELECTED_CONTRIBUTING_TEAM, { detail: filteredTeams }));
    setSelectedContributingTeams([...filteredTeams]);
  };

  const onAddRemoveContributorClickHandler = () => {
    onOpenPopup('Contributors');
  };

  useEffect(() => {
    getAllContributors(null);
    getAllTeams();
  }, []);

  const onSaveClickHandler = () => {
    onClose();
  };

  const onContributorClicked = (contributor: any) => {
    window.open('/members/' + contributor?.uid, '_blank');
  };

  const getTeamsCount = () => {
    let selectedTeamsCount = selectedContributingTeams?.length;

    if(selectedMaintainingTeam) {
      selectedTeamsCount += 1;
    }
    
    return selectedTeamsCount
  }

  return (
    <>
      <div className="projectContributorsc">
        {errors.length > 0 && (
          <ul className="projectContributorsc__errors">
            {errors.map((error: string, index: number) => (
              <li key={`project-error-${index}`}>{error}</li>
            ))}
          </ul>
        )}

        <div className="projectContributorsc__teams">
          <div className="projectContributorsc__teams__titlesec">
            <h2 className="projectContributorsc__teams__title">TEAMS ({getTeamsCount()})</h2>
            {(selectedContributingTeams.length > 0 || selectedMaintainingTeam) && <AddDropdown onOpenPopup={onOpenPopup} maintainerTeam={selectedMaintainingTeam} />}
          </div>

          <div className="projectContributorsc__teams__selectedTeams">
            {!selectedMaintainingTeam && selectedContributingTeams.length === 0 && (
              <div className="projectContributorsc__teams__selectedTeams__team">
                <div className="projectContributorsc__teams__selectedTeams__teamc">
                  <p className="projectContributorsc__teams__selectedTeams__teamc__nrf">No teams added</p>
                </div>
                <AddDropdown onOpenPopup={onOpenPopup} maintainerTeam={selectedMaintainingTeam} />
              </div>
            )}
            {selectedMaintainingTeam && (
              <div className={`projectContributorsc__teams__selectedTeams__team ${selectedContributingTeams.length > 0 ? 'border-bottom' : ''}`}>
                <div className="projectContributorsc__teams__selectedTeams__teamc">
                  <div className="projectContributorsc__teams__selectedTeams__teamc__namec">
                    <img
                      className="projectContributorsc__teams__selectedTeams__teamc__namec__profile"
                      height={20}
                      width={20}
                      src={selectedMaintainingTeam?.logo ? selectedMaintainingTeam.logo : '/icons/team-default-profile.svg'}
                    />

                    <div className="projectContributorsc__teams__selectedTeams__teamc__namec__name">{selectedMaintainingTeam.name}</div>
                  </div>
                  <div className="projectContributorsc__teams__selectedTeams__teamc__opts">
                    <div className="projectContributorsc__teams__selectedTeams__teamc__opts__badge">
                      <img src="/icons/badge/maintainer.svg" height={20} width={20} />
                      <div className="projectContributorsc__teams__selectedTeams__teamc__opts__badge__name">Maintainer Team</div>
                    </div>

                    <button type="button" onClick={() => onOpenPopup('MaintainingTeam')} className="projectContributorsc__teams__selectedTeams__teamc__opts__change">
                      <img height={24} width={24} src={'/icons/recycle-gray.svg'} />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <HiddenField value={selectedMaintainingTeam?.uid} defaultValue={''} name={`maintainingTeamUid`} />

            {selectedContributingTeams?.map((team: any, index: number) => (
              <div key={`${team}+${index}`} className={`projectContributorsc__teams__selectedTeams__team ${index < selectedContributingTeams.length - 1 ? 'border-bottom' : ''}`}>
                <div className="projectContributorsc__teams__selectedTeams__teamc">
                  <div className="projectContributorsc__teams__selectedTeams__teamc__namec">
                    <img className="projectContributorsc__teams__selectedTeams__teamc__namec__profile" height={20} width={20} src={team?.logo ? team.logo : '/icons/team-default-profile.svg'} />
                    <div className="projectContributorsc__teams__selectedTeams__teamc__namec__name">{team.name}</div>
                  </div>

                  <button type="button" onClick={() => onDeleteContributingTeam(team)}>
                    <img height={24} width={24} src={'/icons/delete-gray.svg'} />
                  </button>
                </div>
                <HiddenField value={team?.name ?? ''} defaultValue={team?.name ?? ''} name={`contributingTeams${index}-name`} />
                <HiddenField value={team?.uid} defaultValue={team?.uid} name={`contributingTeams${index}-uid`} />
              </div>
            ))}
          </div>

          <div className="projectContributorsc__teams__descSec">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" className="projectContributorsc__teams__descSec__nte" />
            <span className="projectContributorsc__teams__descSec__desc">Adding a maintainer team is required, and only one team can serve as the maintainer. </span>
          </div>
        </div>

        <div className="projectContributorsc__contributors">
          <div className="projectContributorsc__contributors__titlesec">
            <div className="projectContributorsc__contributors__titlesec__title">CONTRIBUTORS ({selectedContributors?.length})</div>
            {selectedContributors?.length > 0 && (
              <button type="button" className="projectContributorsc__contributors__titlesec__addBtn" onClick={onAddRemoveContributorClickHandler}>
                Add/Remove
              </button>
            )}
          </div>

          {selectedContributors.length === 0 && (
            <div className="projectContributorsc__contributors__empty">
              <div className="projectContributorsc__contributors__empty__txt">No contributors added</div>

              <button type="button" onClick={onAddRemoveContributorClickHandler} className="projectContributorsc__contributors__empty__opt">
                <img height={16} width={16} src={'/icons/add.svg'} />
                <span>Add</span>
              </button>
            </div>
          )}

          {selectedContributors.length > 0 && (
            <>
              <div className="projectContributorsc__contributors__sContributors">
                {selectedContributors?.map((contributor: any, index: any) => (
                  <div onClick={() => onContributorClicked(contributor)} className='projectContributorsc__contributors__sContributors__cptr' key={`${contributor} + ${index}`}>
                    <img className="projectContributorsc__contributors__sContributors__profile" height={32} width={32} src={contributor?.logo ? contributor.logo : '/icons/default_profile.svg'} />
                    <HiddenField value={contributor?.uid} defaultValue={contributor?.uid} name={`contributions${index}-memberUid`} />
                    <HiddenField value={contributor?.cuid} defaultValue={contributor?.cuid} name={`contributions${index}-uid`} />
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="projectContributorsc__contrs__descSec">
            <img src="/icons/info.svg" alt="name info" width="16" height="16px" className="projectContributorsc__contrs__descSec__nte" />
            <span className="projectContributorsc__contrs__descSec__desc">
              Contributors are individuals who have made past contributions or are currently actively contributing to a project in various ways.
            </span>
          </div>
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
          selectedContributors={[...selectedContributors]}
          setSelectedContributors={setSelectedContributors}
          selectedMaintainingTeam={selectedMaintainingTeam}
          selectedTeams={getSelectedTeams()}
          selectedContributingTeams={[...selectedContributingTeams]}
          setSelectedContributingTeams={setSelectedContributingTeams}
        />
      </Modal>

      <Modal modalRef={contributorsPopupRef} onClose={onClose}>
        <ContributorsPopup
          getAllContributors={getAllContributors}
          contributors={[...initialContributors]}
          allTeams={initialTeams}
          selectedContributors={[...selectedContributors]}
          setSelectedContributors={setSelectedContributors}
          from={'Contributors'}
          onClose={onClose}
          onSaveClicked={onSaveClickHandler}
          onSkipAndSaveClicked={onSaveClickHandler}
        />
        <RegsiterFormLoader />
      </Modal>

      <style jsx>
        {`
          button {
            background: inherit;
          }
          .projectContributorsc {
            display: flex;
            flex-direction: column;
            padding: 8px 16px 100px 16px;
            gap: 16px;
          }


                .projectContributorsc__errors {
            color: red;
            font-size: 12px;
          }

          .projectContributorsc__teams__titlesec {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .projectContributorsc__teams {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .projectContributorsc__teams__title {
            font-size: 12px;
            line-height: 32px;
            font-weight: 700;
            color: #64748b;
          }

          .projectContributorsc__teams__selectedTeams {
            background-color: white;
            border-radius: 8px;
          }

          .border-bottom {
            border-bottom: 1px solid #e2e8f0;
          }

          .projectContributorsc__teams__selectedTeams__team {
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .projectContributorsc__teams__selectedTeams__teamc {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 32px;
          }

          .projectContributorsc__teams__selectedTeams__teamc__namec {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .projectContributorsc__teams__selectedTeams__teamc__nrf {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          color: #64748B;

          }

      .projectContributorsc__teams__descSec__nte {
          margin-top: 2px;}

          .projectContributorsc__contrs__descSec__nte {
          margin-top: 2px;}

          .projectContributorsc__contributors__sContributors__cptr {
          cursor: pointer;}

          .projectContributorsc__teams__selectedTeams__teamc__namec__profile {
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            background-color: #e2e8f0;
          }

          .projectContributorsc__teams__selectedTeams__teamc__namec__name {
            color: #64748b;
            font-size: 14px;
            font-weight: 400;
            line-height: 32px;
          }

          .projectContributorsc__teams__selectedTeams__teamc__opts {
            display: flex;
            gap: 20px;
            align-items: center;
          }

          .projectContributorsc__teams__selectedTeams__teamc__opts__badge {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .projectContributorsc__teams__selectedTeams__teamc__opts__badge__name {
            font-size: 13px;
            font-weight: 400;
            line-height: 20px;
          }

          .projectContributorsc__teams__descSec {
            display: flex;
            gap: 6px;
            align-items: start;
            margin-top: 8px;
          }

          .projectContributorsc__teams__descSec__desc {
            font-size: 13px;
            line-height: 18px;
            font-weight: 500;
            color: #0f172a66;
          }

                   .projectContributorsc__contrs__descSec {
            display: flex;
            gap: 6px;
            align-items: start;
            margin-top: 8px;
          }

          .projectContributorsc__contrs__descSec__desc {
            font-size: 13px;
            line-height: 18px;
            font-weight: 500;
            color: #0f172a66;
          }

          .projectContributorsc__contributors {
          display: flex;
          gap: 4px;
          flex-direction: column;}

          .projectContributorsc__contributors__titlesec {
          display: flex;
          align-items: center;
          justify-content: space-between;
          }

          .projectContributorsc__contributors__titlesec__title {
          font-size: 12px;
          line-height: 32px;
          font-weight: 700;
          color: #64748B;
          }

          .projectContributorsc__contributors__titlesec__addBtn {
          color: #156FF7;
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          }

          .projectContributorsc__contributors__empty {
          height: 64px;
          padding: 22px; 20px;
          border-radius: 8px;
          background-color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          }

          .projectContributorsc__contributors__empty__txt {
          font-size: 14px;
          line-height: 20px;
          font-weight: 400;
          color: #64748B;
          }

          .projectContributorsc__contributors__empty__opt {
          display: flex;
          gap: 4px;
          align-items: center;
          color:  #156FF7;
          font-size: 14px;
          font-weight: 500;
          line-height: 24px;
          }

          .projectContributorsc__contributors__sContributors {
          padding: 12px;
          border-radius: 8px;
          background-color: white;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          }

          .projectContributorsc__contributors__sContributors__profile {
          border-radius: 50%;
          border: 1px solid #E2E8F0;}
          
          .projectContributorsc__contributors__sContributors__profile:hover {
          border: 2px solid #156ff7;
          border-radius: 50%;
        }

          @media(min-width: 1024px) {
          .projectContributorsc {
          padding: 8px 16px;
          }}
        `}
      </style>
    </>
  );
}
