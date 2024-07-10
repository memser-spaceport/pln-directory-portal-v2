import { getMembersForProjectForm } from '@/services/members.service';
import { triggerLoader } from '@/utils/common.utils';
import { EVENTS } from '@/utils/constants';
import { useEffect, useState } from 'react';

export default function ContributorsPopup(props: any) {
  const selectedContributors = props?.selectedContributors;
  const setSelectedContributors = props?.setSelectedContributors;

  const [tempContributors, setTempContributors] = useState<any>([...selectedContributors]);

  const contributors = props?.contributors ?? [];
  const from = props?.from;
  const setStep = props?.setStep;
  const onSkipAndSaveClicked = props?.onSkipAndSaveClicked;
  const onSaveClicked = props?.onSaveClickHandler;

  const onCheckBoxChange = (contributor: any) => {
    const isContain = tempContributors.some((data: any) => data.uid === contributor.uid);

    if (isContain) {
      const filteredContributors = tempContributors.filter((data: any) => data.uid !== contributor.uid);
      setTempContributors(filteredContributors);
      return;
    }

    setTempContributors((pre: any) => {
      return [...pre, contributor];
    });
  };

  const getIsSelected = (contributor: any) => {
    const tempAndSelectedContributors = [...selectedContributors, ...tempContributors];
    return tempAndSelectedContributors.some((selected: any) => selected.uid === contributor.uid);
  };

  const onBackClickHandler = () => {
    setStep('Teams');
  };

  const onSkipAndSaveClickHandler = () => {
    onSkipAndSaveClicked();
  };

  const onSaveClickHandler = () => {
    setSelectedContributors(tempContributors);
    onSaveClicked();
  };

  return (
    <div>
      <div>
        <div>
          Heading
          <button onClick={onBackClickHandler}>Back</button>
          <button onClick={onSkipAndSaveClickHandler}>Skip and save</button>
          <button onClick={onSaveClickHandler}>Save</button>
        </div>
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
  );
}
