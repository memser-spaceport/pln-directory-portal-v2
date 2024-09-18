import SearchableSingleSelect from '@/components/form/searchable-single-select';
import SingleSelectWithImage from '@/components/form/single-select-with-image';
import { useState } from 'react';

const AttendeeTeam = (props: any) => {
  const teams = props?.teams;
  const [selectedTeam, setSelectedTeam] = useState(props?.selectedTeam);

  const handleTeamChange = (option: any) => {
    setSelectedTeam(option);
  };

  return (
    <div className="attendtm">
      <span className="attendtm__ttl">Team</span>
      <SingleSelectWithImage
        id="going-team-info"
        isMandatory={true}
        placeholder="Select a team"
        displayKey="name"
        options={teams}
        selectedOption={selectedTeam || ''}
        uniqueKey="teamUid"
        iconKey="logo"
        defaultIcon="/icons/team-default-profile.svg"
        onItemSelect={handleTeamChange}
        arrowImgUrl="/icons/arrow-down.svg"
      />

      <style jsx>
        {`
          .attendtm {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .attendtm__ttl {
            font-size: 14px;
            font-weight: 600;
          }
        `}
      </style>
    </div>
  );
};

export default AttendeeTeam;
