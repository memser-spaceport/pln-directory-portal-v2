import CustomCheckbox from '@/components/form/custom-checkbox';
import { IUserInfo } from '@/types/shared.types';
import { getFormattedDateString } from '@/utils/irl.utils';

interface IGatherings {
  selectedLocation: string;
  gatherings: any[];
  userInfo: IUserInfo;
}

const Gatherings = (props: IGatherings) => {
  const selectedLocation = props?.selectedLocation ?? '';
  const gatherings = props?.gatherings ?? [];
  const userInfo = props?.userInfo;


  const getIsAlreadyBooked = (gathering: any) => {
    return gathering?.guests?.some((guest: any) => guest?.uid === userInfo?.uid);
  }

  return (
    <>
      <div className="gatrs">
        <span className="gatrs__ttl">{`select gatherings that you are attending in ${selectedLocation}`}</span>

        <div className="gatrs__all">
          {gatherings?.map((gathering: any, index: number) => {
            const  isBooked = getIsAlreadyBooked(gathering);
            return (
              <div key={`${gathering.uid} - ${index}`} className={`gatrs__all__gatr  ${isBooked ? 'disable' : ''}`}>
                <div className={`gatrs__all__gatr__ckbox`}>
                  {gathering?.type !== "invite-"}
                  <CustomCheckbox name={`gatherings${index}-uid`} value={gathering.uid} disabled = {isBooked}  />
                </div>
                <div className={`${index + 1 < gatherings.length ? 'gatrs__all__gatr__bb' : ''} gatrs__all__gatr__dteandname`}>
                  <div className="gatrs__all__gatr__dteandname__dat">{getFormattedDateString(gathering.startDate, gathering.endDate)}</div>
                  <div className="gatrs__all__gatr__dteandname__nmesec">
                    <img height={20} width={20} src={gathering?.logo} />

                    <span className="gatrs__all__gatr__dteandname__nmesec__name">{gathering?.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>
        {`

        .disable {
        background-color: #E2E8F0;
        
        }
          .gatrs {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .gatrs__ttl {
            font-size: 14px;
            font-weight: 600;
            line-height: 20px;
          }

          .gatrs__all {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
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
