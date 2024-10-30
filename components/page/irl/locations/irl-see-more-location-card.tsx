import { ILocationDetails } from "@/types/irl.types";


interface IrlSeeMoreLocationCardProps {
    locationRef: React.RefObject<HTMLDivElement>;
    handleClick: (e: React.MouseEvent) => void;
    locations: ILocationDetails[];
    count: number;
}

const IrlSeeMoreLocationCard = (props: IrlSeeMoreLocationCardProps) => {
    const { locationRef, handleClick, locations, count } = props;
    const locationsToSlice = count + 3;
    return (
        <>
            <div
                ref={locationRef}
                className="root__irl__expanded"
                onClick={(e:any)=>handleClick(e)}
            >
                <div
                    className="root__irl__expanded__showMore"
                >
                    See Other Locations
                </div>
                <div className="root_irl__expanded__imgcntr">
                    {locations?.slice(count, locationsToSlice).map((location: { flag: any; }, index: React.Key | null | undefined) => (
                        <div key={index} className="root_irl__expanded__imgcntr__img">
                            <img src={location.flag} alt="flag" style={{ width: '20px', height: '20px' }} />
                        </div>
                    ))}
                </div>
                <div className="root__irl__expanded__icon">
                    <img src="/images/irl/upsideCap.svg" alt="downArrow" />
                </div>
            </div>
            <style jsx>{`
                            .root__irl__expanded {
                    display: flex;
                    flex-direction: column;
                    text-align: center;
                    background-color: #D0E7FA;
                    width: 161px;
                    height: 150px;
                    justify-content: center;
                    text-align: center;
                    border-radius: 8px;
                    border: 1px solid #156FF7;
                    position: relative;
                    cursor: pointer;
                }

                .root_irl__expanded__imgcntr {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }

                .root__irl__expanded:hover {
                    position: relative;
                    animation:moveBackground 4s forwards  // 
                }

                .root__irl__expanded__showMore {
                    font-size: 12px;
                    font-weight: 500;
                    line-height: 14px;
                    text-align: center;
                }

                .root_irl__expanded__imgcntr__img {
                    background-color: #ffffff;
                    border-radius: 100%;
                    width: 32px;
                    height: 32px;
                    padding:  4px 0px 0px;
                    gap: 10px;
                    border: 1px solid #CBD5E1;
                }

                 @media (min-width: 360px) {
                  
                    .root__irl__expanded{
                        width: 140px;
                        height: 100px;
                        gap: 5px;
                        background: 
                            linear-gradient(152.61deg, #F5F8FF 24.8%, #BBDEF7 108.1%);
                    }

                   
                    .root__irl__expanded__showMore {
                        width: 140px;
                        margin-top: 6px;
                        padding-bottom: 1px;
                    }

                    .root_irl__expanded__imgcntr__img {
                        width: 29px;
                        height: 29px;
                        font-size: 14px;
                    }

                }

                @media (min-width: 1024px) {
                    .root__irl__expanded {
                        width: 161px;
                        height: 150px;
                        background: 
                            linear-gradient(152.61deg, #F5F8FF 24.8%, #BBDEF7 108.1%), 
                            url("/images/irl/Clouds v2.svg");
                        background-size: cover; 
                        background-blend-mode: overlay; 
                        gap: 5px;
                        transition: background-position 4s; /* Smooth transition */
                    }

                    .root__irl__expanded:hover {
                        animation: moveBackground 4s linear forwards; /* Ensure keyframes are defined */
                    }

                    .root__irl__expanded__showMore {
                        width: 161px;
                        margin-top: 10px;
                        padding-bottom: 6px;
                    }

                    .root_irl__expanded__imgcntr__img {
                        width: 32px;
                        height: 32px;
                        ont-size: 16px;
                        padding:  5px 0px 5px 0px;
                    }

                }


                @media (min-width: 1920px) {
                    .root__irl__expanded {
                        align-items: center;
                        width: 225px;
                        background: 
                        linear-gradient(152.61deg, #F5F8FF 24.8%, #BBDEF7 108.1%), 
                        url("/images/irl/2560 animation asset v3.2.svg");
                    }
                }

                @media (min-width: 2560px) {
                    .root__irl__expanded {
                        width: 305px;
                        height: 150px;
                    }
                }
                        `}</style>
        </>
    );
};

export default IrlSeeMoreLocationCard;