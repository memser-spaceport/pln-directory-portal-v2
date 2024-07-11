import SearchableSingleSelect from '@/components/form/searchable-single-select';
import { getMembersForProjectForm } from '@/services/members.service';
import { triggerLoader } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import { useEffect, useState } from 'react';

export default function ContributorsPopup(props: any) {
  const selectedContributors = props?.selectedContributors;
  const setSelectedContributors = props?.setSelectedContributors;

  const getAllContributors = props?.getAllContributors;


  const allTeams = props?.allTeams;

  const [tempContributors, setTempContributors] = useState<any>([...selectedContributors]);

  const [selectedTeam, setSelectedTeam] = useState(null);

  const contributors = props?.contributors;

  useEffect(() => {
    setTempContributors([...selectedContributors])
  }, [allTeams])


  const from = props?.from;
  const setStep = props?.setStep;
  const onSkipAndSaveClicked = props?.onSkipAndSaveClicked;
  const onSaveClicked = props?.onSaveClickHandler;

  const onCheckBoxChange = (contributor: any) => {
    const isContain = tempContributors.some((data: any) => data.uid === contributor.uid);

    if (isContain) {
      console.log(selectedContributors, contributor);
      const filteredContributors = tempContributors.filter((data: any) => data.uid !== contributor.uid);
      setTempContributors(filteredContributors);
      return;
    }

    setTempContributors((pre: any) => {
      return [...pre, contributor];
    });
  };

  const getIsSelected = (contributor: any) => {
    const tempAndSelectedContributors = [...tempContributors];
    return tempAndSelectedContributors.some((selected: any) => selected.uid === contributor.uid);
  };

  const onBackClickHandler = () => {
    setStep('Teams');
    setTempContributors([...selectedContributors]);
  };

  const onSkipAndSaveClickHandler = () => {
    onSkipAndSaveClicked();
    setTempContributors([...selectedContributors]);
  };

  const onSaveClickHandler = () => {
    setSelectedContributors(tempContributors);
    onSaveClicked();
  };

  const onClearTeamSearch = () => {};

  const onTeamSelectionChanged = async (item: any) => {
    getAllContributors(item.uid);
  };

  return (
    <>
      <div className="cpc">
        {from === 'Teams' && (
          <div>
            <div>
              Heading
              <button onClick={onBackClickHandler}>Back</button>
              <button onClick={onSkipAndSaveClickHandler}>Skip and save</button>
              <button onClick={onSaveClickHandler}>Save</button>
            </div>
          </div>
        )}

        <div>
          {from === 'Cotributors' && (
            <div>
              <SearchableSingleSelect
                id="project-register-contributor-info"
                placeholder="All Team"
                displayKey="name"
                options={allTeams}
                selectedOption={selectedTeam}
                uniqueKey="teamUid"
                formKey="teamTitle"
                name={`projectInfo-teamTitle`}
                onClear={() => onClearTeamSearch()}
                onChange={(item) => onTeamSelectionChanged(item)}
                arrowImgUrl="/icons/arrow-down.svg"
              />
            </div>
          )}
        </div>
        {contributors.length === 0 && <div>No Members found</div>}

        {contributors.length > 0 && (
          <>
            {contributors.map((contributor: any, index: any) => (
              <div key={`${contributor} + ${index}`}>
                <input type="checkbox" className="w-full" checked={getIsSelected(contributor)} onChange={() => onCheckBoxChange(contributor)} />
                <div>{contributor.name}</div>
              </div>
            ))}
          </>
        )}
      </div>

      <style jsx>
        {`
          .cpc {
            height: 70vh;
            padding: 30px;
            width: 50vw;
          }

          @media (min-width: 1024px) {
            .cpc {
              width: 665px;
            }
          }
        `}
      </style>
    </>
  );
}
