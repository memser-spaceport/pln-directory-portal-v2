import { IIrlLocationCard } from '@/types/irl.types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface IrlLocationCardProps {
    isActive: boolean;
    onCardClick: () => void;
    uid?: string;
    priority?: number;
    location: string;
    flag?: string;
    pastEvents?: any[];
    upcomingEvents?: any[];
    icon?: string;
}

const IrlLocationCard = ({ isActive, onCardClick, ...props }: IrlLocationCardProps) => {
    //props
    const id = props?.uid;
    const locationName = props?.location.split(",")[0].trim();
    const locationUrl = props?.flag;
    const pastEvents = props?.pastEvents?.length ?? 0;
    const upcomingEvents = props?.upcomingEvents?.length ?? 0;
    const bannerImage = props?.icon;

    return (
        <>
            <div className={`root ${isActive ? 'root__active' : 'root__inactive'}`} onClick={onCardClick}>
                <div className='root__irlCard'>
                    <img src={bannerImage ? bannerImage : "/images/irl/defaultImg.svg"} alt="location" />
                </div>
                <div className='root__irlLocation'>
                    <div className="root__location">
                        <img src={locationUrl} alt="flag" style={{ width: '20px', height: '20px' }} />
                        <div className="root__location__name">{locationName}</div>
                    </div>
                    <div className='root__event__cntr'>
                        <div className='root__events p-2'>
                            {upcomingEvents > 0 && (
                                <>
                                    <span>{upcomingEvents}{' '}</span>Upcoming
                                </>
                            )}
                        </div>
                        <div className='root__events'>
                            {pastEvents > 0 && (
                                <>
                                    <span>{pastEvents}{' '}</span>{' '}Past

                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .root {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    background-color: #ffffff;
                    box-shadow: 0px 4px 4px 0px #0f172a0a;
                    cursor: pointer;
                    width: 164px;
                    height: 100px;
                    // padding: 8px 12px 16px 12px;
                    gap: 2px;
                    border-radius: 8px;
                    align-items: center;
                    background: linear-gradient(71.47deg, #427DFF 8.43%, #44D5BB 87.45%) 1;
                    
                }

                .root__active {
                    position: relative;
                    // padding: 5px 10px;
                    background: linear-gradient(180deg, #EDF8FF 0%, #E0FFE3 100%);
                }

                .root__active::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 8px; 
                    border: 2px solid transparent;
                    background: linear-gradient(71.47deg, #427DFF 8.43%, #44D5BB 87.45%) border-box;
                    -webkit-mask:
                      linear-gradient(#fff 0 0) padding-box, 
                      linear-gradient(#fff 0 0);
                    -webkit-mask-composite: destination-out;
                    mask-composite: exclude;
                }


                .root__active:hover {
                    background: linear-gradient(180deg, #EDF8FF 0%, #E0FFE3 100%);
                }

                .root__inactive {
                    border: 2px solid transparent;

                }

                .root__inactive:hover {
                    border: 2px solid #156FF7;
                    border-radius: 8px;
                }
                .root__irlCard {
                    display: flex;
                    flex-direction: column;
                    gap: 5px; 
                    height: 66px;
                    width: 65px;
                    margin-top: 8px;
                    left: 4.5px;
                }

                .root__location {
                    display: flex;
                    flex-direction: row;
                    gap: 5px;
                    align-items: center;
                }

                .root__location__name {
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 20px;
                    text-align: left;
                    // padding-bottom: 2px;
                }

                .root__events {
                    font-size: 11px;
                    font-weight: 400;
                    line-height: 14px;
                    text-align: left;
                }

                .root__events span {
                    color: #156FF7;
                    font-weight: 500;
                }

                .root__irlLocation {
                    display: flex;
                    flex-direction: column;
                    text-align: center;
                    align-items: center;
                }   

                .root__event__cntr {
                    display: flex;
                    flex-direction: column;
                }

                @media (min-width: 360px) {
                    .root {
                        width: 140px;
                        justify-content: center;
                        left :0
                    }

                    .root__location {
                        padding-bottom: 4px;
                    }
                    
                    .root__irlCard {
                         display: none;
                    }
                }    

                @media (min-width: 1024px) {
                    .root {
                        width: 164px;
                        height: 150px;
                        padding-bottom: 12px;
                    }
                    
                    .root__location {
                        padding-left: 6px;
                        padding-right: 2px;
                    }

                    .root__irlCard {
                        display: flex;
                    }
                }

                @media (min-width: 1440px) {
                    .root {
                        width: 162px;
                        height: 149px;
                    }

                    .root__event__cntr {
                        flex-direction: row;
                        gap: 5px;
                    }

                    
                }

                @media (min-width: 1920px) {
                     .root {
                        flex-direction: row;
                        gap: 10px;
                        width: 223px;
                        height: 150px;
                    }

                    .p-2 {
                        padding-left: 5px;
                    }

                    .root__irlLocation {
                        align-items: start;
                    } 
                }

                @media (min-width: 2560px) {
                    .root {
                        width: 304px;
                        height: 150px;
                    }
                }
            `}</style>
        </>
    );
}

export default IrlLocationCard;