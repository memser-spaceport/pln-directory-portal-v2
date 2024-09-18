import { Tooltip } from '@/components/core/tooltip/tooltip';
import CustomCheckbox from '@/components/form/custom-checkbox';
import { IUserInfo } from '@/types/shared.types';
import { EVENT_TYPE } from '@/utils/constants';
import { getFormattedDateString } from '@/utils/irl.utils';
import { useState } from 'react';
import ParticipationDetails from './participation-details';
import HiddenField from '@/components/form/hidden-field';

interface IGatherings {
  selectedLocation: any;
  gatherings: any[];
  userInfo: IUserInfo | null;
  errors: any;
}

const Gatherings = (props: IGatherings) => {
  const selectedLocation = props?.selectedLocation ?? '';
  const gatherings = props?.gatherings ?? [];
  const userInfo = props?.userInfo;
  const errors = props?.errors;

  const isGatheringsError = errors?.gatheringsError?.length > 0 ? true : false;

  const [selectedGatherings, setSelectedGatherings] = useState<any[]>(getSelectedGatherings());

  function getIsAlreadyBooked(gathering: any) {
    return gathering?.guests?.some((guest: any) => guest?.uid === userInfo?.uid);
  }

  function getSelectedGatherings() {
    return gatherings?.filter((gathering: any) => getIsAlreadyBooked(gathering));
  }

  const onGatheringSelectClickHandler = (gathering: any) => {
    setSelectedGatherings((prev) => {
      const isAlreadySelected = prev.some((item) => item.uid === gathering.uid);

      if (isAlreadySelected) {
        return prev.filter((item) => item.uid !== gathering.uid);
      } else {
        return [...prev, { ...gathering, hostSubEvents: [], speakerSubEvents: [] }];
      }
    });
  };

  return (
    <>
      <div className="gatrs">
        {/* All Gatherings */}
        <div className="gatrs__all">
          <span className="gatrs__ttl">{`select gatherings that you are attending in ${selectedLocation?.name}`}</span>
          <div className={`gatrs__all__gths ${isGatheringsError ? 'error' : ''}`}>
            {gatherings?.map((gathering: any, index: number) => {
              const isBooked = getIsAlreadyBooked(gathering);
              console.log('gathering is', gathering);
              return (
                <div key={`${gathering.uid} - ${index}`} className={`gatrs__all__gatr  ${isBooked ? 'disable' : ''}`}>
                  <div className={`gatrs__all__gatr__ckbox`}>
                    {gathering?.type === EVENT_TYPE.INVITE_ONLY && isBooked && (
                      <CustomCheckbox onSelect={() => onGatheringSelectClickHandler(gathering)} name={`events${index}-uid`} value={gathering.uid} disabled={isBooked} />
                    )}
                    {gathering?.type === EVENT_TYPE.INVITE_ONLY && !isBooked && (
                      <Tooltip
                        content={'This is an invite only event'}
                        trigger={
                          <div className="gatrs__all__gatr__ckbox__invtonly">
                            <img src="/icons/invite-only.svg" height={12} width={12} />
                          </div>
                        }
                        asChild
                      />
                    )}
                    {gathering?.type != EVENT_TYPE.INVITE_ONLY && (
                      <CustomCheckbox onSelect={() => onGatheringSelectClickHandler(gathering)} name={`events${index}-uid`} value={gathering.uid} disabled={isBooked} />
                    )}
                  </div>
                  <div className={`${index + 1 < gatherings.length ? 'gatrs__all__gatr__bb' : ''} gatrs__all__gatr__dteandname`}>
                    <div className="gatrs__all__gatr__dteandname__dat">{getFormattedDateString(gathering.startDate, gathering.endDate)}</div>
                    <div className="gatrs__all__gatr__dteandname__nmesec">
                      <img className="gatrs__all__gatr__dteandname__nmesec__logo" height={20} width={20} src={gathering?.logo?.cid} />
                      <span className="gatrs__all__gatr__dteandname__nmesec__name">{gathering?.name}</span>
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
            <ParticipationDetails selectedGatherings={selectedGatherings} setSelectedGatherings={setSelectedGatherings} />
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

          .gatrs__all {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .gatrs__all__gths {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
          }

          .error {
            border: 1px solid #dc2625;
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

          .gatrs__all__gatr__ckbox__invtonly {
            height: 20px;
            width: 20px;
            min-height: 20px;
            min-width: 20px;
            background-color: #f9f3e9;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            border: 0.83px solid #f19100;
          }

          .gatrs__all__gatr__dteandname__nmesec__logo {
            object-fit: cover;
          }

          @media (min-width: 1024px) {
            .gatrs__all__gatr__dteandname {
              border-bottom: unset;
              flex-direction: row;
              align-items: center;
              padding: unset;
              height: 36px;
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
