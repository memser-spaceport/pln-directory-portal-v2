import { getFormattedDateString } from '@/utils/irl.utils';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import Image from 'next/image';
import { IRL_EVENTS_DEFAULT_IMAGE, ADMIN_ROLE } from '@/utils/constants';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import { IUserInfo } from '@/types/shared.types';
import { getAccessLevel } from '@/utils/auth.utils';

interface IrlEventsTableViewProps {
  index?: number;
  gathering: any;
  handleClick: (resources: any, event?: any) => void;
  isLastContent: boolean;
  handleElementClick?: (gathering: any) => void;
  isEventSelected?: boolean;
  eventType?: boolean;
  isLoggedIn: boolean;
  userInfo?: IUserInfo;
  onDeleteEvent?: (gathering: any) => void;
  eventsToShow?: any;
  resources?: any;
}

const IrlEventsTableView = ({ 
  index, 
  gathering, 
  handleClick, 
  isLastContent, 
  handleElementClick, 
  isEventSelected, 
  eventType, 
  isLoggedIn,
  userInfo,
  onDeleteEvent
}: IrlEventsTableViewProps) => {
  const handleRowClick = (gathering: any) => {
    if (eventType && handleElementClick) {
      handleElementClick(gathering);
    }
  };
  
  const website = gathering?.resources?.find((resource: any) => resource?.name?.toLowerCase() === 'website');

  const accessLevel = getAccessLevel(userInfo as IUserInfo, isLoggedIn);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteEvent) {
      onDeleteEvent(gathering);
    }
  };

  return (
    <>  
      <div
        id={gathering?.uid}
        key={index}
        className={`root__irl__table-row__content ${isLastContent ? 'last-content' : ''} ${isEventSelected ? 'root__irl__table-row__content--active' : ''}`}
        onClick={() => handleRowClick(gathering)}
      >
        <div className="root__irl__table-col__contentName">
          <div className="root__irl__table-header">
            <div className="root__irl__table-col-header">
              <div className="root__irl__table-col__contentName__top">
                <div className="root__irl__table-col__contentName__top__left">
                  <img src={gathering?.logo?.url || IRL_EVENTS_DEFAULT_IMAGE} style={{ height: '20px', width: '20px' }} alt="logo" />
                {website && (
                  <a onClick={(e) => e.stopPropagation()} className="root__irl__table-col__contentName__top__website" target="_blank" href={website?.link}>
                    {gathering?.name}
                    <img className="root__irl__table-col__contentName__top__website__icon" alt="redirect" src="/icons/arrow-blue.svg" height={10} width={10} />
                  </a>
                )}
                {!website && <div className="root__irl__table-col__contentName__top__title">{gathering.name}</div>}
                </div>
                {accessLevel === 'advanced' && (
                  <button 
                    className="root__irl__table-col__contentName__top__delete" 
                    onClick={handleDeleteClick}
                    title="Delete Event"
                  >
                    <img src="/icons/delete.svg" alt="delete" height={16} width={16} />
                  </button>
                )}
              </div>
              <div className="root__irl__table-col__contentName__bottom">
                <div
                  className="root__irl__table-col__contentName__bottom__date"
                  style={gathering.eventGuests?.length > 0 ? { paddingRight: '10px', marginRight: '10px', borderRight: '1px solid #cbd5e1' } : {}}
                >
                  {getFormattedDateString(gathering?.startDate, gathering?.endDate, true)}
                </div>

                {gathering.eventGuests?.length > 0 && (
                  <div className="root__irl__table-col__contentName__attendee__list">
                    <span className="root__irl__imgsec__images">
                      {gathering.eventGuests?.slice(0, 3).map((member: any, index: number) => {
                        const defaultAvatar = getDefaultAvatar(member?.member?.name);

                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <Image
                            key={index}
                            style={{ marginLeft: `-6px` }}
                            className="root__irl__imgsec__images__img"
                            src={member?.member?.image?.url || defaultAvatar}
                            alt="attendee"
                            height={18}
                            width={18}
                          />
                        );
                      })}
                    </span>
                    <span className="">
                      {gathering.eventGuests?.length > 0 ? gathering.eventGuests?.length : ''} {gathering?.eventGuests.length > 1 ? 'Attendees' : 'Attendee'}
                    </span>
                  </div>
                )}
              </div>
              <div className="root__irl__table-col__contentName__resSection">
                {gathering?.resources?.length > 0 && (
                  <div className="root__irl__table-col__contentRes__viewCnt" onClick={(event) => gathering?.resources?.length > 0 && handleClick(gathering?.resources, event)}>
                    <div style={{ display: 'flex' }}>
                      <img src="/images/irl/elements.svg" alt="view" />
                    </div>
                    <div>View Resources</div>
                  </div>
                )}
              </div>
            </div>
            {gathering?.type && (
              <div className="root__irl__table-col__inviteOnlyIcon">
                <Tooltip
                  asChild
                  side="top"
                  align="center"
                  trigger={
                    <div>
                      <img src="/icons/Invite_only.svg" alt="invite-only" />
                    </div>
                  }
                  content={<div>This is an invite only event</div>}
                />
              </div>
            )}
          </div>
        </div>
        <div className="root__irl__table-col__contentDesc" dangerouslySetInnerHTML={{ __html: gathering?.description }}></div>
      </div>
      <style jsx>{`
        .root__irl__table-header {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
        }

        .root__irl__imgsec__images {
          display: flex;
          justify-content: end;
          padding-right: 5px;
        }

        .root__irl__table-col-header {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        .root__irl__table-row__content {
          display: flex;
          flex-direction: row;
          width: 100%;
          font-size: 13px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          cursor: ${eventType ? 'pointer' : ''};
        }

        .root__irl__table-row__content {
          border-top: none;
          border-right: 1px solid #cbd5e1;
          border-bottom: 1px solid #cbd5e1;
          border-left: 1px solid #cbd5e1;
          min-height: ${eventType ? '' : '54px'};
        }

        .last-content {
          border-bottom-left-radius: 4px;
          border-bottom-right-radius: 4px;
        }

        .root__irl__table-row__content--active {
          background-color: rgba(219, 234, 254, 0.5);
        }

        .root__irl__table-col__headerName,
        .root__irl__table-col__contentName {
          width: 325px;
          padding: 10px;
          border-right: 1px solid #cbd5e1;
        }

        .root__irl__table-col__headerName,
        .root__irl__table-col__headerDesc {
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__table-col__headerDesc,
        .root__irl__table-col__contentDesc {
          width: 660px;
          padding: 10px;
        }

        .root__irl__table-col__contentName__top__website {
          display: inline-block;
          color: #156ff7;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
        }

        .root__irl__table-col__contentName__top__website__icon {
          margin-top: 5px;
          margin-left: 8px;
        }

        .root__irl__table-col__contentName__top__delete {
          background-color: transparent;
          width: 16px;
          height: 16px;
        }

        .root__irl__table-col__contentName__top__delete:hover {
          background-color: #fee2e2;
        }

        .root__irl__table-col__headerName,
        .root__irl__table-col__headerDesc .root__irl__table-col__contentName,
        .root__irl__table-col__contentDesc {
          padding: 10px;
        }

        .root__irl__table-col__contentDesc {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-left: 10px;
        }

        .root__irl__table-col__contentName {
          display: flex;
          flex-direction: column;
        }

        .root__irl__table-col__contentName__top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .root__irl__table-col__contentName__top__left {
          display: flex;
          flex-direction: row;
          gap: 4px;
        }

        .root__irl__table-col__contentName__top__title {
          font-size: 13px;
          font-weight: 600;
          line-height: 20px;
          text-align: left;
        }

        .root__irl__table-col__contentName__bottom {
          font-size: 11px;
          font-weight: 400;
          line-height: 20px;
          text-align: left;
          display: flex;
          flex-direction: row;
          align-items: center;
          flex-wrap: wrap;
        }

        .root__irl__table-col__contentName__resSection {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 5px;
          padding: 10px 0px 0px 0px;
        }

        .root__irl__table-col__contentName__attendee__list {
          display: flex;
          flex-direction: row;
          gap: 2px;
          align-items: center;
          padding-left: 5px;
          font-size: 10px;
          font-weight: 400;
          line-height: 20px;
        }
        .root__irl__table-col__inviteOnlyIcon {
          padding-left: 4px;
        }

        .root__irl__table-col__contentRes__viewCnt {
          display: flex;
          flex-direction: row;
          gap: 5px;
          align-items: center;
          align-self: center;
          cursor: pointer;
          background-color: #f1f5f9;
          padding: 0px 8px;
          border-radius: 35px;
          font-size: 11px;
          font-weight: 500;
          line-height: 20px;
          text-align: center;
          color: #156ff7;
        }

        @media (min-width: 1440px) {
          .root__irl__table-col__headerName,
          .root__irl__table-col__contentName {
            width: 299px;
          }

          .root__irl__table-col__headerDesc,
          .root__irl__table-col__contentDesc {
            width: 727px;
          }
        }

        @media (min-width: 1920px) {
          .root__irl__table-col__headerName,
          .root__irl__table-col__contentName {
            width: 355px;
          }

          .root__irl__table-col__headerDesc,
          .root__irl__table-col__contentDesc {
            width: 1095px;
          }

          .root__irl__table-col__contentName__bottom {
            width: 350px;
          }
        }

        @media (min-width: 2560px) {
          .root__irl__table-col__headerName,
          .root__irl__table-col__contentName {
            width: 502px;
          }

          .root__irl__table-col__headerDesc,
          .root__irl__table-col__contentDesc {
            width: 1411px;
          }
        }
      `}</style>
    </>
  );
};

export default IrlEventsTableView;
