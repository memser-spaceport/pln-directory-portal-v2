import Modal from "@/components/core/modal";
import Link from "next/link";

interface IrlEventsPopupOverlayProps {
    dialogRef: React.RefObject<HTMLDivElement>;
    onCloseModal: () => void;
    resources: any[];
    isLoggedIn: boolean;
    onLoginClickHandler: () => void;
    handleAdditionalResourceClick: (resource: any) => void;
}

const IrlEventsPopupOverlay = ({ dialogRef,
    onCloseModal,
    resources,
    isLoggedIn,
    onLoginClickHandler,
    handleAdditionalResourceClick }: IrlEventsPopupOverlayProps) => {

    const resourcesToDisplay = resources.filter(resource => {
        if (isLoggedIn) {
            // If logged in, show all resources regardless of isPublic
            return true;
        } else {
            // If logged out, show only public resources
            return resource.isPublic === true;
        }
    });
    return (
        <>
            <Modal modalRef={dialogRef} onClose={onCloseModal}>
                <div className="root__irl__resPopup">
                    <div className="root__irl__modalHeader">
                        <div className="root__irl__modalHeader__title">Resources</div>
                        <div className="root__irl__modalHeader__count">({resources?.length})</div>
                    </div>
                    {!isLoggedIn &&
                        <div className="root__irl__popup__header">
                            <div style={{ display: 'flex' }}>
                                <img src="/icons/info-orange.svg" alt="info" />
                            </div>
                            <div>
                                This list contains private links. Please <span onClick={onLoginClickHandler} className="root__irl__popup__header__loginBtn">login</span> to access
                            </div>
                        </div>
                    }
                    <div className="root__irl__popupCntr">
                        {resourcesToDisplay.map((resource, index) => (
                            <div key={index} className="root__irl__popupCnt" onClick={handleAdditionalResourceClick}>
                                <div>
                                    {resource?.icon ? (
                                        <img src={resource.icon} style={{ height: '20px', width: '20px' }} alt="icon" />
                                    ) : (
                                        <img src="/icons/hyper-link.svg" alt="icon" />
                                    )}
                                </div>
                                <div className="root__irl__popupcnt__title">
                                    <a href={resource.link} target='_blank'>
                                        {resource.name}
                                    </a>
                                </div>
                                <div>
                                    <img src="/icons/arrow-blue.svg" alt="arrow icon" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
            <style jsx>{`
                    .root__irl__resPopup {
                        display: flex;
                        overflow-y: auto;
                        flex-direction: column;
                        padding: 20px;
                    }

                    .root__irl__modalHeader {
                        display: flex;
                        flex-direction: row;
                        gap: 8px;
                        position: absolute;
                        width: 100%;
                        gap: 8px;
                    }

                    .root__irl__modalHeader__title {
                        font-size: 24px;
                        font-weight: 700;
                        line-height: 32px;
                        text-align: left;
                    }

                    .root__irl__modalHeader__count {
                        font-size: 14px;
                        font-weight: 400;
                        line-height: 32px;
                        text-align: left;
                        padding-top: 3px;
                    }


                    .root__irl__popup__header {
                        font-size: 13px;
                        font-weight: 400;
                        line-height: 20px;
                        text-align: left;
                        // color: #475569;
                        background-color: #FFE2C8;
                        margin-top: 50px;
                        display: flex;
                        flex-direction: row;
                        height: 44px;
                        justify-content: center;
                        align-items: center;
                        border-radius: 8px;
                    }

                    .root__irl__popup__header__noResource {
                        font-size: 13px;
                        font-weight: 400;
                        line-height: 20px;
                        text-align: left;
                        color: #475569;
                        // background-color: #FFE2C8;
                        margin-top: 50px;
                        display: flex;
                        flex-direction: row;
                        height: 44px;
                        justify-content: center;
                        align-items: center;
                        border-radius: 8px;
                        border: 1px solid #CBD5E1;
                    }

                    .root__irl__popup__header__loginBtn {
                        color: #156FF7;
                        cursor: pointer;
                    }

                    .root__irl__popupCnt {
                        display: flex;
                        flex-direction: row;
                        gap: 8px;
                        width: 594px;
                        padding: 14px 0px 14px 0px;
                        gap: 10px;
                        border-bottom: 1px solid #CBD5E1;
                        color: #156FF7;
                    }

                    .root__irl__popupCntr {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                        overflow-y: auto;
                        margin-top: ${isLoggedIn ? '44px' : '14px'};
                    }

                    .root__irl__popupcnt__title {
                        min-height: 24px;
                    }

                @media screen and (min-width: 360px) {
                    .root__irl__resPopup {
                        width: 90vw;
                        height: 394px;
                    }

                    .root__irl__popupCnt {
                        width: 100%;
                    }
                }

                @media screen and (min-width: 1024px) {
                     .root__irl__resPopup {
                        width: 650px;
                        height: 394px;
                    }
                }
            `}</style>
        </>
    )
}

export default IrlEventsPopupOverlay;

