import HiddenField from '@/components/form/hidden-field';
import SearchableSingleSelect from '@/components/form/searchable-single-select';
import SingleSelectWithImage from '@/components/form/single-select-with-image';
import { getMember, getMembersForAttendeeForm, getMembersForProjectForm } from '@/services/members.service';
import { getMemberPreferences } from '@/services/preferences.service';
import { IIrlAttendeeFormErrors, IIrlEvent, IIrlLocation } from '@/types/irl.types';
import { IUserInfo } from '@/types/shared.types';
import { getParsedValue, getUserInfoFromLocal, triggerLoader } from '@/utils/common.utils';
import { EVENTS, IAM_GOING_POPUP_MODES, IRL_ATTENDEE_FORM_ERRORS } from '@/utils/constants';
import { SetStateAction, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { getGuestDetail } from '@/services/irl.service';
import { transformGuestDetail } from '@/utils/irl.utils';

interface IAttendeeForm {
  memberInfo: IUserInfo | null;
  initialValues: any;
  mode: string;
  allGuests: any[];
  errors: IIrlAttendeeFormErrors;
  setFormInitialValues: SetStateAction<any>;
  location: IIrlLocation;
  eventType: string;
  gatherings: IIrlEvent[];
  setIsVerifiedMember: any;
  setGuestGoingEvents: any;
}

const AttendeeDetails = (props: IAttendeeForm) => {
  const member = props?.memberInfo;
  const initialValues = props?.initialValues;
  const mode = props?.mode;
  const allGuests = props?.allGuests ?? [];
  const errors = props?.errors ?? [];
  const setFormInitialValues = props?.setFormInitialValues;
  const location = props?.location;
  const eventType = props?.eventType ?? '';
  const gatherings = props?.gatherings ?? [];
  const setIsVerifiedMember = props?.setIsVerifiedMember;
  const setGuestGoingEvents = props?.setGuestGoingEvents;

  const [initialContributors, setInitialContributors] = useState([]);
  const [initialTeams, setInitialTeams] = useState(initialValues?.teams ?? []);

  //variables
  const authToken = getParsedValue(Cookies.get('authToken'));

  const [selectedTeam, setSelectedTeam] = useState(initialValues?.team ?? { name: '', logo: '', uid: '' });
  const [selectedMember, setSelectedMember] = useState<IUserInfo>(member || { name: '', uid: '' });
  
  const handleTeamChange = (option: any) => {
    setSelectedTeam({...option,  uid: option.id});
  };

  const onResetMember = () => {
    setSelectedMember({ name: '', uid: '' });
    setInitialTeams([]);
    setSelectedTeam({ name: '', logo: '', uid: '' });
    setFormInitialValues(null);
  };

  useEffect(() => {
    if (mode === IAM_GOING_POPUP_MODES.ADMINADD) {
      getAllContributors('');
    }
  }, []);

  const getAllContributors = async (teamUid: any) => {
    try {
      triggerLoader(true);
      const result = await getMembersForAttendeeForm();
      if (result?.isError) {
        triggerLoader(false);
        return false;
      }
      setInitialContributors(result.data);
      triggerLoader(false);
      return true;
    } catch (e) {
      console.error(e);
      triggerLoader(false);
      return false;
    }
  };

  const onMemberSelectionChanged = async (item: any) => {
    setSelectedMember(item);
  };

  useEffect(() => {
    if (selectedMember.uid) {
      const fetchGuestDetails = async () => {
        try {
          let result = await getGuestDetail(selectedMember.uid ?? '', location.uid, authToken, eventType);
          const userGoingEvents =  result?.map((e:any)=>({
            uid: e?.event?.uid,
            isHost: e?.isHost,
            isSpeaker: e?.isSpeaker,
            hostSubEvents: e?.additionalInfo?.hostSubEvents,
            speakerSubEvents: e?.additionalInfo?.speakerSubEvents,
            }))
            
            setGuestGoingEvents(userGoingEvents)

          if (result.length>0) {
            const formData = transformGuestDetail(result, gatherings);

            updateMemberDetails(false);
            setSelectedTeam({name: formData?.teamName,
              uid: formData?.teamUid,
              logo: formData?.teamLogo ?? '',});
            setInitialTeams(formData.teams);
            setFormInitialValues(formData);
          } else {
            updateMemberDetails(true);
            setFormInitialValues(null);
            return;
          }
        } catch (error) {
          console.error("Error fetching guest details:", error);
          // Optionally handle error
        }
      };
  
      fetchGuestDetails();
    }
  }, [selectedMember]);
  

  // useEffect(() => {
  //   if (selectedMember.uid) {
  //     const isMemberAvailable = allGuests.some((guest: any) => guest.memberUid === selectedMember.uid);
  //     if (!isMemberAvailable) {
  //       updateMemberDetails(true);
  //       setFormInitialValues(null);
  //       return;
  //     } else {
  //       const member = allGuests.find((guest: any) => guest.memberUid === selectedMember.uid);
  //       updateMemberDetails(false);
  //       const formData = {
  //         team: {
  //           name: member?.teamName,
  //           logo: member?.teamLogo,
  //           uid: member?.teamUid,
  //         },
  //         member: {
  //           name: member?.memberName,
  //           logo: member?.memberLogo,
  //           uid: member?.memberUid,
  //         },
  //         events: member?.events,
  //         teamUid: member?.teamUid,
  //         teams: member?.teams?.map((team: any) => {
  //           return { ...team, uid: team?.id };
  //         }),
  //         memberUid: member?.memberUid,
  //         additionalInfo: { checkInDate: member?.additionalInfo?.checkInDate || '', checkOutDate: member?.additionalInfo?.checkOutDate ?? '' },
  //         topics: member?.topics,
  //         reason: member?.reason,
  //         telegramId: member?.telegramId,
  //         officeHours: member?.officeHours ?? '',
  //       };
  //       setSelectedTeam(formData.team);
  //       setInitialTeams(formData.teams);
  //       setFormInitialValues(formData);
  //     }
  //     // document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_TELEGRAM_HANDLE, { detail: { telegramHandle: '', showTelegram: false } }));
  //     // document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_OFFICE_HOURS, { detail: { officeHours: '' } }));
  //   }
  // }, [selectedMember]);

  const updateMemberDetails = async (updateAll: boolean) => {
    try {
      triggerLoader(true);
      const memberResult = await getMember(selectedMember.uid ?? '', { with: 'image,skills,location,teamMemberRoles.team' }, true, selectedMember, false);
      const memberPreferencesResponse = await getMemberPreferences(selectedMember.uid ?? '', authToken);
      if (memberPreferencesResponse.isError) {
        return { isError: true };
      }
      let showTelegram = memberPreferencesResponse?.memberPreferences?.telegram ?? true;
      if (!memberResult.error) {
        const memberData = memberResult?.data?.formattedData;
        setIsVerifiedMember(memberData?.isVerified)
        document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_TELEGRAM_HANDLE, { detail: { telegramHandle: memberData?.telegramHandle, showTelegram } }));
        document.dispatchEvent(new CustomEvent(EVENTS.UPDATE_OFFICE_HOURS, { detail: { officeHours: memberData?.officeHours } }));
        if (updateAll) {
          document.dispatchEvent(new CustomEvent(EVENTS.TRIGGER_REGISTER_LOADER, { detail: false }));
          const teams = memberData?.teams?.map((team: any) => {
            return { ...team, uid: team.id };
          });
          const mainTeam = teams.find((team: any) => team.mainTeam) ?? { name: '', logo: '', uid: '' };
          setInitialTeams(teams);
          setSelectedTeam(mainTeam);
        }
        triggerLoader(false);
      }
    } catch (e) {
      triggerLoader(false);
      console.error(e);
    }
  };

  return (
    <>
      <div className="attenddtls">
        <div className={`attenddtls__member ${mode != IAM_GOING_POPUP_MODES.ADMINADD ? 'hide' : ''}`}>
          <div className="attenddtls__member__ttl">People</div>
          <div className="details__cn__teams__mems">
            <SearchableSingleSelect
              id="irl-member-info"
              placeholder="Select people"
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
              showClear={mode === IAM_GOING_POPUP_MODES.ADMINADD}
              closeImgUrl="/icons/close.svg"
              isError={!selectedMember?.uid && errors?.gatheringErrors?.includes(IRL_ATTENDEE_FORM_ERRORS.SELECT_MEMBER)}
            />
          </div>
        </div>

        <div className="attenddtls__team">
          <span className="attenddtls__team__ttl">Team</span>
          <SingleSelectWithImage
            id="going-team-info"
            isMandatory={true}
            placeholder="Select a team"
            displayKey="name"
            options={initialTeams}
            selectedOption={selectedTeam}
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
