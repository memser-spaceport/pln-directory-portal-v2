import HiddenField from '@/components/form/hidden-field';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import SingleSelectWithImage from '@/components/form/single-select-with-image';
import { getMember, getMembersForProjectForm } from '@/services/members.service';
import { EVENTS, IAM_GOING_POPUP_MODES } from '@/utils/constants';
import { useEffect, useState } from 'react';

const AttendeeDetails = (props: any) => {
  const member = props?.memberInfo;
  const mode = props?.mode;
  const allGuests = props?.allGuests ?? [];

  const [initialContributors, setInitialContributors] = useState([]);
  const [initialTeams, setInitialTeams] = useState(props?.teams ?? []);

  const [selectedTeam, setSelectedTeam] = useState(props?.selectedTeam);
  const [selectedMember, setSelectedMember] = useState(member ?? { name: '', uid: '' });

  const [isMemberExists, setIsMembeExists] = useState(false);

  const handleTeamChange = (option: any) => {
    setSelectedTeam(option);
  };

  const onResetMember = () => {
    setSelectedMember({ name: '', uid: '' });
    setInitialTeams([]);
    setSelectedTeam(null);
  };

  useEffect(() => {
    if (mode === IAM_GOING_POPUP_MODES.ADMINADD) {
      getAllContributors('');
    }
  }, []);

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

  const onMemberSelectionChanged = async (item: any) => {
    setSelectedMember(item);
  };

  useEffect(() => {
    if (selectedMember.uid) {
      const isMemberAvailable = allGuests.some((guest: any) => guest.memberUid === selectedMember.uid);
      if (!isMemberAvailable) {
        getAndSetMemberTeams();
        setIsMembeExists(false);
        return;
      }
      setIsMembeExists(true);
    } else {
      setIsMembeExists(false);
      document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_TELEGRAM_HANDLE, { detail: { telegramHandle: '', showTelegram: false } }));
      document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_OFFICE_HOURS, { detail: { officeHours: '' } }));
    }
  }, [selectedMember]);

  const getAndSetMemberTeams = async () => {
    try {
      document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: true }));
      const result = await getMember(selectedMember.uid, { with: 'image,skills,location,teamMemberRoles.team' }, true, selectedMember, false);
      if (!result.error) {
        document.dispatchEvent(
          new CustomEvent(EVENTS.UPDATE_TELEGRAM_HANDLE, { detail: { telegramHandle: result.data.formattedData?.telegramHandle, showTelegram: result.data.formattedData?.preferences } })
        );
        document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_OFFICE_HOURS, { detail: { officeHours: result.data.formattedData?.officeHours } }));
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        const teams = result?.data?.formattedData?.teams?.map((team: any) => {
          return { ...team, uid: team.id };
        });
        document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
        const mainTeam = teams.find((team: any) => team.mainTeam);
        setInitialTeams(teams);
        setSelectedTeam(mainTeam);
      }
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <>
      <div className="attenddtls">
        <div className={`attenddtls__member ${!IAM_GOING_POPUP_MODES.ADMINADD ? 'hide' : ''}`}>
          <div className="attenddtls__member__ttl">Member</div>
          <div className="details__cn__teams__mems">
            <SearchableSingleSelect
              id="irl-member-info"
              placeholder="Select member"
              displayKey="name"
              options={initialContributors}
              selectedOption={selectedMember}
              uniqueKey="memberUid"
              formKey="uid"
              name={`memberUid`}
              onChange={(item) => onMemberSelectionChanged(item)}
              arrowImgUrl="/icons/arrow-down.svg"
              iconKey="logo"
              defaultImage="/icons/default-user-profile.svg"
              onClear={onResetMember}
              showClear
              closeImgUrl="/icons/close.svg"
            />
          </div>
          {isMemberExists && <div className="details__cn__teams__mems__warning">Member already added</div>}
        </div>

        <div className="attenddtls__team">
          <span className="attenddtls__team__ttl">Team</span>
          <SingleSelectWithImage
            id="going-team-info"
            isMandatory={true}
            placeholder="Select a team"
            displayKey="name"
            options={initialTeams}
            selectedOption={selectedTeam || { name: '' }}
            uniqueKey="teamUid"
            iconKey="logo"
            defaultIcon="/icons/team-default-profile.svg"
            onItemSelect={handleTeamChange}
            arrowImgUrl="/icons/arrow-down.svg"
          />
        </div>
      </div>

      <style jsx>
        {`
          .attenddtls {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .attenddtls__member {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .attenddtls__team {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .attenddtls__team__ttl,
          .attenddtls__member__ttl {
            font-size: 14px;
            font-weight: 600;
          }

          .details__cn__teams__mems__warning {
            font-size: 13px;
            color: #ef4444;
            font-weight: 400;
          }

          .hide {
            display: none;
          }
        `}
      </style>
    </>
  );
};

export default AttendeeDetails;
