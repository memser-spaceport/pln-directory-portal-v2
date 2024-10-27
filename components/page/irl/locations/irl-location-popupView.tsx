import { IPastEvents, IUpcomingEvents } from "@/types/irl.types";

interface IrlLocationPopupViewProps {
    location: {
        flag: string;
        location: string;
        upcomingEvents?: IUpcomingEvents[];
        pastEvents?: IPastEvents[];
    };
    handleResourceClick: (location: any) => void;
}

const IrlLocationPopupView = (props: IrlLocationPopupViewProps) => {
    const { location, handleResourceClick } = props;

    const upcomingEvents = location.upcomingEvents ?? [];
    const pastEvents = location.pastEvents ?? [];
    return (
        <>
            <div key={location.location} className="root__irl__overlay__cnt" onClick={() => handleResourceClick(location)}>
                <div className="root__irl__overlay__cnt__location">
                    <div className="root__irl__overlay__cnt__location__icon"><img src={location.flag} alt="flag" style={{ width: '20px', height: '20px' }} /></div>
                    <div className="root__irl__overlay__cnt__location__title">{location.location.split(",")[0].trim()}</div>
                </div>
                <div className="root__irl__overlay__cnt__events">
                    {upcomingEvents?.length > 0 &&
                        <>
                            <span>{location.upcomingEvents?.length ?? 0}</span>{' '} Upcoming
                        </>
                    }
                    {pastEvents?.length > 0 &&
                        <>
                            <span>{location.pastEvents?.length ?? 0}</span>{' '} Past

                        </>
                    }
                </div>
            </div>
            <style jsx>{`
                .root__irl__overlay__cnt {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    gap: 10px;
                    padding: 5px;
                    color: #0F172A;
                    cursor: pointer;
                }

                .root__irl__overlay__cnt:hover {
                    background-color: #F7FAFC;
                }

                .root__irl__overlay__cnt__location, 
                .root__irl__overlay__cnt__events {
                    display: flex;
                    flex-direction: row;
                    gap: 10px;
                }

                .root__irl__overlay__cnt__location {
                    max-width: 141px;
                    min-height: 28px;
                    gap: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 24px;
                    text-align: left;
                    color: #0F172A;
                }

                .root__irl__overlay__cnt__location__icon, .root__irl__overlay__cnt__location__title {
                    display: flex;
                    align-items: center;
                }

                .root__irl__overlay__cnt__events {
                    font-size: 11px;
                    font-weight: 600;
                    line-height: 14px;
                    text-align: left;
                    color: #475569;
                    align-items: center;
                }

                .root__irl__overlay__cnt__events span {
                    color: #156FF7;
                }
            `}</style>
        </>
    );
};

export default IrlLocationPopupView;