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

  const selectedTeams = props?.selectedTeams;

  const [step, setStep] = useState('Teams');
  const [temMaintainingTeam, setTempMaintainingTeam] = useState();

  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [allContributors, setAllContributors] = useState<any>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    getAllTeams();
    document.addEventListener(EVENTS.PROJECT_ADD_MODAL_CLOSE_EVENT, () => {setStep('Teams'); reset()});
    }, []);

  const getAllTeams = async () => {
    try {
      const result = await getTeamsForProject();
      if (result.isError) {
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));

        return;
      }
      setFilteredTeams(result.data);
      setTeams(result.data);
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    } catch (error) {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
    }
  };

  const reset = () => {
    setStep('Teams');
    getAllTeams();
    if (searchInputRef?.current) {
      searchInputRef.current.value = '';
    }
  };
  const onSelectTeamHandler = async (team: any) => {
    setTempMaintainingTeam(team);
    document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
    const members = await getAllContributors(team);
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
      return result.data;
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
  };

  const onSaveClickHandler = () => {
    setSelectedMaintainingTeam(temMaintainingTeam);
    setStep('Teams');
    onClose();
  };

  const onSearchChangeHandler = (e: any) => {
    const name = e.target.value.toLowerCase();
    setFilteredTeams(teams.filter((team: any) => team.name.toLowerCase().includes(name)));
  };

  const onBackClickHandler = () => {
    setFilteredTeams(teams);
  };

  return (
    <>
      {step === 'Teams' && (
        <div className="mtc">
          <div className="mtcSec">
            <div className="mtc__header">
              <div className="mtc__titles">
                <h2 className="mtc__titles">Select Maintainer Team</h2>
                <p className="mtc__titles__des">Select a maintainer team from the list below</p>
              </div>
              <div className="mtc__search">
                <img height={15} width={15} src="/icons/search-gray.svg"></img>
                <input ref={searchInputRef} onChange={onSearchChangeHandler} className="mtc__search__input" placeholder="Search"></input>
              </div>
            </div>

            <div className="mtcSec__teams">
              {filteredTeams?.length === 0 && <div className="mtcSec__teams__etr">No teams found</div>}
              {filteredTeams?.length > 0 && (
                <div className="mtc__tamCtrSec">
                  {filteredTeams.map((team: any, index: number) => {
                    const isSelected = selectedTeams.some((data: any, index: number) => team.uid === data.uid);
                    return (
                      <div className="mtc__teamCtr" key={`${team}+${index}`}>
                        <div className="mtc__teamCtr__team">
                          <div className="mtc__teamCtr__team__profileSec">
                            <img className="mtc__teamCtr__team__profileSec__profile" height={40} width={40} src={team?.logo ? team?.logo : '/icons/team-default-profile.svg'} />
                            <div>
                              <h3 className="mtc__teamCtr__team__profileSec__name">{team?.name}</h3>
                            </div>
                          </div>

                          <div className="mtc__teamCtr__opt">
                            {isSelected && (
                              <div className="mtc__teamCtr__opt__addedSec">
                                <img src="/icons/added.svg" />
                                <span className="mtc__teamCtr__opt__addedSec__txt">Added</span>
                              </div>
                            )}
                            {!isSelected && (
                              <button type="button" className="mtc__teamCtr__opt__select" onClick={() => onSelectTeamHandler(team)}>
                                Select
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 'Contributors' && (
        <ContributorsPopup
          onSaveClickHandler={onSaveClickHandler}
          onSkipAndSaveClicked={onSkipAndSaveClickHandler}
          setStep={setStep}
          selectedContributors={[...selectedContributors]}
          setSelectedContributors={setSelectedContributors}
          contributors={allContributors}
          onBackClicked={onBackClickHandler}
          from="Teams"
        />
      )}

      <style jsx>
        {`
          .mtc {
            height: 80vh;
            padding: 24px 10px 24px 24px;
          }

          .mtc__titles {
            font-size: 20px;
            line-height: 22px;
            font-weight: 600;
          }

          .mtc__titles__des {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
          }

          .mtc__search {
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            margin-top: 18px;
            padding: 12px;
            display: flex;
            gap: 5px;
            align-items: center;
          }

          .mtc__search__input {
            width: 100%;
            border: none;
            outline: none;
          }

          .mtc__team {
            height: 60px;
          }

          .mtc__teamCtr__team {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
          }

          .mtc__teamCtr__team__profileSec {
            display: flex;
            gap: 9px;
            align-items: center;
          }

          .mtcSec {
            display: flex;
            flex-direction: column;
            height: 100%;
          }

          .mtcSec__teams {
            flex: 1;
            overflow: auto;
          }

          .mtc__header {
            display: flex;
            flex-direction: column;
            height: 118px;
          }

          .mtc__teamCtr__team__profileSec__profile {
            background-color: #e2e8f0;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
          }

          .mtc__teamCtr {
            height: 60px;
          }

          .mtc__tamCtrSec {
            margin-top: 10px;
          }

          .mtc__teamCtr__team__profileSec__name {
            font-size: 16px;
            font-weight: 400;
            line-height: 20px;
          }

          .mtc__teamCtr__opt {
            margin-right: 10px;
          }

          .mtc__teamCtr__opt__select {
            padding: 6px 12px;
            color: #156ff7;
            border: 1px solid #156ff7;
            border-radius: 4px;
            font-size: 14px;
            background-color: inherit;
          }

          .mtc__teamCtr__opt__addedSec__txt {
            color: #475569;
            font-size: 14px;
            cursor: default;
          }

          .mtc__teamCtr__opt__addedSec {
            display: flex;
            gap: 4px;
          }

          .mtcSec__teams__etr {
            font-size: 14px;
            text-align: center;
            margin-top: 10px;
          }

          @media (min-width: 1024px) {
            .mtc {
              width: 665px;
            }

            .mtc__titles__des {
              line-height: 28px;
            }
          }
        `}
      </style>
    </>
  );
}
