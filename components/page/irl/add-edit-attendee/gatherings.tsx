import { Tooltip } from '@/components/core/tooltip/tooltip';
import CustomCheckbox from '@/components/form/custom-checkbox';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE, EVENT_TYPE, IRL_ATTENDEE_FORM_ERRORS } from '@/utils/constants';
import { getFormattedDateString } from '@/utils/irl.utils';
import { SetStateAction, useEffect, useState } from 'react';
import ParticipationDetails from './participation-details';
import HiddenField from '@/components/form/hidden-field';
import { IIrlAttendeeFormErrors, IIrlEvent, IIrlGathering, IIrlLocation } from '@/types/irl.types';
import { log } from 'console';

interface IGatherings {
  selectedLocation: IIrlLocation;
  gatherings: IIrlEvent[];
  userInfo: IUserInfo | null;
  errors: IIrlAttendeeFormErrors;
  initialValues: any;
  guests: any;
  setErrors: SetStateAction<any>;
  loggedInUserInfo: IUserInfo | null;
  isVerifiedMember: any;
}

const Gatherings = (props: IGatherings) => {
  const selectedLocation = props?.selectedLocation ?? '';
  const gatherings = props?.gatherings ?? [];
  const userInfo = props?.userInfo;
  const loggedInUserInfo = props?.loggedInUserInfo;
  const errors = props?.errors;
  const initialValues = props?.initialValues;
  const guests = props?.guests;
  const isVerifiedMember = props?.isVerifiedMember;

  const isAdmin = Array.isArray(loggedInUserInfo?.roles) && loggedInUserInfo?.roles.includes(ADMIN_ROLE);

  const isGatheringsError = errors?.gatheringErrors?.length > 0 ? true : false;

  const [selectedGatherings, setSelectedGatherings] = useState<any[]>([]);

  function getIsAlreadyBooked(gathering: any) {
    return initialValues?.events?.some((selectedGathering: any) => selectedGathering?.uid === gathering?.uid);
  }

  const onGatheringSelectClickHandler = (gathering: any) => {
    setSelectedGatherings((prev) => {
      const isAlreadySelected = prev.some((item) => item.uid === gathering.uid);
      if (isAlreadySelected) {
        return prev.filter((item) => item.uid !== gathering.uid);
      } else {
        return [...prev, { ...gathering, hostSubEvents: [], speakerSubEvents: [], logo: gathering?.logo?.url }];
      }
    });
  };

  useEffect(() => {
    setSelectedGatherings(initialValues?.events ?? []);
  }, [initialValues]);

  return (
    <>
      <div className="gatrs">
        {/* All Gatherings */}
        <div className="gatrs__all">
          <div className="gatrs__ttl">
            <p>
              {`Select gatherings that you are attending in ${selectedLocation?.name}`}
              <span className="gatrs__ttl__mantry">*</span>
            </p>
          </div>
          <div className={`gatrs__all__gths ${errors?.gatheringErrors?.includes(IRL_ATTENDEE_FORM_ERRORS.SELECT_GATHERING) && !selectedGatherings?.length ? 'error' : ''}`}>
            {gatherings?.map((gathering: any, index: number) => {
              const isBooked = getIsAlreadyBooked(gathering);
              return (
                <div key={`${gathering.uid} - ${index}`} className={`gatrs__all__gatr  ${isBooked ? 'disable' : ''}`}>
                  <div className={`gatrs__all__gatr__ckbox`}>
                    {gathering?.type === EVENT_TYPE.INVITE_ONLY && isBooked && (
                      <CustomCheckbox onSelect={() => onGatheringSelectClickHandler(gathering)} name={`events${index}-uid`} value={gathering.uid} initialValue={isBooked} disabled={isBooked} />
                    )}

                    {gathering?.type === EVENT_TYPE.INVITE_ONLY && !isBooked && isAdmin && (
                      <CustomCheckbox onSelect={() => onGatheringSelectClickHandler(gathering)} name={`events${index}-uid`} value={gathering.uid} initialValue={isBooked} disabled={isBooked} />
                    )}
                    {gathering?.type != EVENT_TYPE.INVITE_ONLY && (
                      <CustomCheckbox onSelect={() => onGatheringSelectClickHandler(gathering)} name={`events${index}-uid`} value={gathering.uid} initialValue={isBooked} disabled={isBooked} />
                    )}
                  </div>
                  <div className={`${index + 1 < gatherings.length ? 'gatrs__all__gatr__bb' : ''} gatrs__all__gatr__dteandname`}>
                    <div className="gatrs__all__gatr__dteandname__dat">{getFormattedDateString(gathering.startDate, gathering.endDate)}</div>
                    <div className="gatrs__all__gatr__dteandname__nmesec">
                      <img className="gatrs__all__gatr__dteandname__nmesec__logo" height={20} width={20} src={gathering?.logo?.url ? gathering?.logo?.url : '/icons/irl-event-default-logo.svg'} />
                      <span className="gatrs__all__gatr__dteandname__nmesec__name">{gathering?.name}</span>
                
                      {gathering?.type === EVENT_TYPE.INVITE_ONLY && (
                      <Tooltip
                        content={'This is an invite only event'}
                        trigger={
                          <img className='gatrs__all__gatr__dteandname__nmesec__invite-only' src="/icons/invite-only-circle.svg" height={16} width={16} />
                        }
                        asChild
                      />
                    )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Host and speaker details */}

        {selectedGatherings.length > 0 && (
          <div>
            <ParticipationDetails isVerifiedMember={isVerifiedMember} errors={errors} selectedGatherings={selectedGatherings} setSelectedGatherings={setSelectedGatherings} />
          </div>
        )}
      </div>

      <style jsx>
        {`
          .disable {
            background-color: #e2e8f0;
          }

          .gatrs {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .gatrs__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .gatrs__ttl__mantry {
            font-size: 14px;
            line-height: 20px;
            font-weight: 600;
          }

          .gatrs__all {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .gatrs__all__gths {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            over-flow: hidden;
          }

          .error {
            border: 1px solid red;
          }

          .gatrs__all__gatr {
            display: flex;
            align-items: center;
          }

          .gatrs__all__gatr__ckbox {
            display: flex;
            min-width: 44px;
            width: 44px;
            align-items: center;
            justify-content: center;
          }

          .gatrs__all__gatr__dteandname {
            display: flex;
            gap: 4px;
            width: 100%;
            flex-direction: column;
            border-left: 1px solid #cbd5e1;
            padding: 8px 12px;
          }

          .gatrs__all__gatr__bb {
            border-bottom: 1px solid #cbd5e1;
          }

          .gatrs__all__gatr__dteandname__dat {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .gatrs__all__gatr__dteandname__nmesec {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .gatrs__all__gatr__dteandname__nmesec__name {
            font-size: 14px;
            font-weight: 400;
            line-height: 20px;
            word-break: break-word;
          }

          .gatrs__all__gatr__dteandname__nmesec__logo {
            object-fit: cover;
          }

          .gatrs__all__gatr__dteandname__nmesec__invite-only {
            display: flex;
          }

          @media (min-width: 1024px) {
            .gatrs__all__gatr__dteandname {
              border-bottom: unset;
              flex-direction: row;
              align-items: center;
              padding: unset;
              min-height: 36px;
              gap: unset;
            }

            .gatrs__all__gatr__dteandname__dat {
              min-width: 123px;
              padding: 0 12px 0 12px;
            }
          }
        `}
      </style>
    </>
  );
};

export default Gatherings;
