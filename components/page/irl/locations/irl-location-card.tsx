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
    let priority = props?.priority;
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
                <div className="root__location">
                    <div>{locationUrl}</div>
                    <div className="root__location__name">{locationName}</div>
                </div>
                <div className='root__events'>
                    <span>{upcomingEvents}{' '}</span>{' '}Upcoming Events
                </div><div className='root__events'>
                    <span>{pastEvents}{' '}</span>{' '}Past Events
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
                    width: 161px;
                    height: 150px;
                    // padding: 8px 12px 16px 12px;
                    gap: 2px;
                    border-radius: 8px;
                    border: 2px solid transparent;
                    align-items: center;
                    background: linear-gradient(71.47deg, #427DFF 8.43%, #44D5BB 87.45%) 1;
                    
                }

                .root__active {
                    background: linear-gradient(180deg, #EDF8FF 0%, #E0FFE3 100%);
                    border-radius: 8px;
                    border-image: linear-gradient(71.47deg, #427DFF 8.43%, #44D5BB 87.45%) 1;
                }

                .root__active:hover {
                    background: linear-gradient(180deg, #EDF8FF 0%, #E0FFE3 100%);
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
                    flex-wrap: wrap;
                }

                .root__location__name {
                    font-size: 14px;
                    font-weight: 600;
                    line-height: 28px;
                    text-align: left;
                }

                .root__events {
                    font-size: 11px;
                    font-weight: 500;
                    line-height: 14px;
                    text-align: left;
                }

                .root__events span {
                    color: #156FF7;
                }

                @media (min-width: 360px) {

                    .root {
                        width: 140px;
                        height: 100px;
                        justify-content: center;
                        left :0
                    }

                    .root__location {
                        padding-bottom: 5px;
                    }
                    
                    .root__irlCard {
                         display: none;
                    }
                }    

                @media (min-width: 1024px) {
                    .root {
                        width: 161px;
                        height: 150px;
                    }
                    
                    .root__location {
                        padding: 0px;
                    }

                    .root__irlCard {
                        display: flex;
                    }
                }
            `}</style>
        </>
    );
}

export default IrlLocationCard;