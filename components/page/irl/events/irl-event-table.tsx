import { Tooltip } from '@/components/core/tooltip/tooltip';
import { getFormattedDateString } from '@/utils/irl.utils';

interface EventDetailsProps {
    eventDetails: {
        upcomingEvents: Array<any>;
        pastEvents: Array<any>;
    };
    isLoggedIn: boolean;
    isUpcoming: boolean;
    handleClick: (resources: any, eventsToShow: any) => () => void;
}

const IrlEventTable = ({ eventDetails, handleClick, isLoggedIn, isUpcoming }: EventDetailsProps) => {
    const eventsToShow = isUpcoming ? eventDetails?.upcomingEvents : eventDetails?.pastEvents;
    const eventType = isUpcoming ? 'Upcoming Events' : 'Past Events';

    return (
        <>
            <div className="root__irl__tableContainer">
                <div className="root__irl__table">
                    {eventsToShow?.length > 0 ? (
                        <>
                            <div className="root__irl__table__header">
                                <div className="root__irl__table-row__header">
                                    <div className="root__irl__table-col__headerName">Name</div>
                                    <div className="root__irl__table-col__headerDesc">Description</div>
                                    <div className="root__irl__table-col__headerRes">Resource</div>
                                </div>
                            </div>

                            {eventsToShow?.map((gathering: any, index: number) => (
                                <div key={index} className="root__irl__table-row__content">
                                    <div className="root__irl__table-col__contentName">
                                        <div className="root__irl__table-header">
                                            <div className="root__irl__table-col-header">
                                                <div className="root__irl__table-col__contentName__top">
                                                    <div><img src={gathering?.logo?.url} style={{ height: '20px', width: '20px' }} alt="logo" /></div>
                                                    <div className="root__irl__table-col__contentName__top__title">{gathering.name}</div>
                                                </div>
                                                <div className="root__irl__table-col__contentName__bottom">{getFormattedDateString(gathering?.startDate, gathering?.endDate)}</div>
                                            </div>
                                            {gathering?.type &&
                                                <div className="root__irl__table-col__inviteOnlyIcon">
                                                    <Tooltip
                                                        asChild
                                                        side="top"
                                                        align="center"
                                                        trigger={
                                                            <div>
                                                                <img src='/icons/Invite_only.svg' alt="invite-only" />
                                                            </div>
                                                        }
                                                        content={
                                                            <div >This is an invite only event</div>
                                                        }
                                                    />
                                                </div>
                                            }
                                        </div>
                                    </div>
                                    <div className="root__irl__table-col__contentDesc">{gathering?.description}</div>
                                    <div className="root__irl__table-col__contentRes" onClick={handleClick(gathering?.resources, eventsToShow)}>
                                        <div><img src="/images/irl/elements.svg" alt="calendar" /></div>
                                        <div style={{ paddingBottom: "4px" }}>view</div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="root__irl__table__no-data">
                            <div><img src="/icons/no-calender.svg" alt="calendar" /></div>
                            <div>No {eventType} currently in this location</div>
                        </div>
                    )}
                </div>
            </div>
            <style jsx>{`
                .root__irl__table-header {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                }

                .root__irl__table-col-header {
                    display: flex;
                    flex-direction: column;
                }

                .root__irl__tableContainer {
                    position: relative;
                    max-height: 256px;
                    overflow: auto;
                    scroll-behavior: smooth;
                }

                .root__irl__table {
                    display: flex;  
                    flex-direction: column;
                    justify-content: space-between;       
                    width: 99.5%;         
                    background-color: #fff;         
                    border-spacing: 5px; 
                }

                .root__irl__table__no-data {
                    border: 1px solid #CBD5E1;
                    display: flex;
                    flex-direction: row;
                    gap: 8px;
                    justify-content: center;
                    height: 54px;
                    align-items: center;
                    font-family: Inter;
                    font-size: 13px;
                    font-weight: 400;
                    line-height: 15px;
                    width: 864px;

                }    

                .root__irl__table-row__header {
                    border: 1px solid #CBD5E1;
                }

                .root__irl__table-row__header , .root__irl__table-row__content {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    min-height: 40px;
                    clear: both;
                    font-size: 13px;
                    font-weight: 400;
                    line-height: 20px;
                    text-align: left;
                }

                .root__irl__table-row__content {
                    border-top: none;
                    border-right: 1px solid #CBD5E1;
                    border-bottom: 1px solid #CBD5E1;
                    border-left: 1px solid #CBD5E1;
                    min-height: 54px;
                }

                .root__irl__table-col__headerName, .root__irl__table-col__contentName {
                    width: 193px;
                    padding: 10px;
                    border-right: 1px solid #CBD5E1;
                }

                .root__irl__table-col__headerName, .root__irl__table-col__headerDesc ,.root__irl__table-col__headerRes {
                    font-size: 13px;
                    font-weight: 600;
                    line-height: 20px;
                    text-align: left;

                }

                .root__irl__table-col__headerDesc, .root__irl__table-col__contentDesc {
                    width: 566px;
                    padding: 10px;
                    border-right: 1px solid #CBD5E1;
                }

                .root__irl__table-col__headerRes, .root__irl__table-col__contentRes  {
                    width: 91px;
                    padding: 10px;
                }

                .root__irl__table-col__headerName ,
                .root__irl__table-col__headerDesc,
                .root__irl__table-col__headerRes,
                .root__irl__table-col__contentName, 
                .root__irl__table-col__contentDesc,
                .root__irl__table-col__contentRes {
                    padding: 10px;
                }

                .root__irl__table-col__contentRes {
                    display: flex;
                    flex-direction: row;
                    gap: 4px;
                    align-items: center;
                    font-size: 11px;
                    font-weight: 500;
                    line-height: 20px;
                    text-align: center;
                    color: #156FF7;
                    cursor: pointer;
                }
                
                .root__irl__table__header {
                    background-color: #F8FAFC;
                }

                .root__irl__addRes ,.root__irl__addRes__loggedOut {
                    display: flex;
                    flex-direction: row;
                    // width: 860px;
                    border-radius: 4px;
                    border: 1px solid #CBD5E1;
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 20px;
                    text-align: left;
                    align-items: ${!isLoggedIn ? 'center' : 'unset'};
                    justify-content: ${!isLoggedIn ? 'center' : 'unset'};
                }

                .root__irl__addRes {
                    background-color: #fff;
                    height: 36px;
                }

                .root__irl__addRes__loggedOut {
                    background-color: #FFE2C8; 
                    height: 44px;
                }

                .root__irl__addRes__cnt__loggedOut {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    gap: 8px;
                    align-items: center;
                }

                .root__irl__addRes__cnt__loggedOut button {
                    background-color: #fff;
                    padding: 4px;
                    width:  45px;
                    height: 30px;
                    padding: 6px 10px 6px 10px;
                    border-radius: 8px ;
                }

                .root__irl__addRes__cnt {
                    display: flex;
                    flex-direction: row;
                    gap:2px;
                    padding: 6px;
                    width: 185px;
                }

                .root__irl__addRes__cnt__icon {
                    display: flex;
                    justify-content: center;
                }

                .root__irl__table-col__contentName {
                    display: flex;
                    flex-direction: column;
                }

                .root__irl__table-col__contentName__top {
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
                }
            `}</style>
        </>

    );
};

export default IrlEventTable;
