import { getFormattedDateString } from "@/utils/irl.utils";
import { Tooltip } from '@/components/core/tooltip/tooltip';

const IrlEventsTableView = ({ index, gathering, handleClick, isLastContent, handleElementClick, isEventSelected, eventType }: any) => {
    const handleRowClick = (gathering: any) => {
        if (eventType) {
            handleElementClick(gathering);
        }
    }

    return (
        <>
            <div
                key={index}
                className={`root__irl__table-row__content ${isLastContent ? 'last-content' : ''} ${isEventSelected ? 'root__irl__table-row__content--active' : ''}`}
                onClick={() => handleRowClick(gathering)}
            >
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
                                    trigger={<div>
                                        <img src='/icons/Invite_only.svg' alt="invite-only" />
                                    </div>}
                                    content={<div>This is an invite only event</div>} />
                            </div>}
                    </div>
                </div>
                <div className="root__irl__table-col__contentDesc">{gathering?.description}</div>
                <div className="root__irl__table-col__contentRes">
                    {gathering?.resources?.length > 0 ?
                        <div
                            className="root__irl__table-col__contentRes__viewCnt"
                            onClick={(event) => gathering?.resources?.length > 0 && handleClick(gathering?.resources, event)}
                        >
                            <div><img src="/images/irl/elements.svg" alt="view" /></div>
                            <div style={{ paddingBottom: "4px" }}>View</div>
                        </div>
                        :
                        <div className="root__irl__table-col__contentRes__noCnt">-</div>
                    }
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

                .root__irl__table-row__content {
                    display: flex;
                    flex-direction: row;
                    width: 100%;
                    font-size: 13px;
                    font-weight: 400;
                    line-height: 20px;
                    text-align: left;
                    cursor: ${eventType ? "pointer" : ""};
                }

                .root__irl__table-row__content {
                    border-top: none;
                    border-right: 1px solid #CBD5E1;
                    border-bottom: 1px solid #CBD5E1;
                    border-left: 1px solid #CBD5E1;
                    min-height: ${eventType ? "" : "54px"};
                }
                    
                .last-content {
                    border-bottom-left-radius: 4px;
                    border-bottom-right-radius: 4px;
                }

                .root__irl__table-row__content--active {
                    background-color: rgba(219, 234, 254, 0.5);
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

                .root__irl__table-col__contentDesc {
                    display: flex;
                    align-items: center;
                }

                .root__irl__table-col__contentRes {
                    display: flex;
                    flex-direction: row;
                    gap: 4px;
                    align-items: center;
                    font-size: 11px;
                    font-weight: 500;
                    line-height: 20px;
                    color: #156FF7;
                    justify-content: center;
                }
                
                .root__irl__table__header {
                    background-color: #F8FAFC;
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
                }
        `}</style>
        </>
    )
}

export default IrlEventsTableView;