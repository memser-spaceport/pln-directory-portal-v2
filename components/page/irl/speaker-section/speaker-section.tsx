'use client';
import React from 'react'
import SpeakerButton from './speaker-button';

interface SpeakerSectionProps {
  eventLocationSummary: any;
  userInfo: any;
  currentGuest: any;
}

const SpeakerSection = ({ eventLocationSummary, userInfo, currentGuest }: SpeakerSectionProps) => {
  return (
    <div className="speaker-section">
        <div className="speaker-section__left">
            <img className="speaker-section__icon" src="/icons/irl/speaker-section-icon.svg" alt="Speaker" />
            Contribute as a speaker and connect with our community at an upcoming event
        </div>
        <div className="speaker-section__right">
            <SpeakerButton eventLocationSummary={eventLocationSummary} userInfo={userInfo} currentGuest={currentGuest} />
        </div>
        
      <style jsx>{`
        .speaker-section {
          width: 100%;
          height: 100%;
          background-color: rgba(238, 255, 238, 1);
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.25);
        }

        .speaker-section__left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          color: rgba(15, 23, 42, 1);
          letter-spacing: 1%;
          max-width: 480px;
        }

        @media (min-width: 365px) {
           .speaker-section__icon {
              content: url("/icons/irl/speaker-section-icon-mobile.svg");
           }

           .speaker-section {
           padding: 10px;
           }

           .speaker-section__right {
            display: flex;
            justify-content: flex-end;
           }
        }

        @media (min-width: 768px) {
          .speaker-section {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px;
            gap: 0;
            padding: 0;
          }

          .speaker-section__right {
            margin-right: 20px;
          }

          .speaker-section__icon {
            content: url("/icons/irl/speaker-section-icon.svg");
          }
        }

        @media (min-width: 1440px) {
          .speaker-section {
            width: 1244px;
          }
        }
        @media (min-width: 1920px) {
          .speaker-section {
            width: 1678px;
          }
        }

        @media (min-width: 2560px) {
          .speaker-section {
            width: 2240px;
          }

      `}</style>
    </div>
  )
}

export default SpeakerSection
