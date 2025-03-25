'use client';

import ShadowButton from '@/components/ui/ShadowButton';
import { useScrollToSection } from '@/hooks/useScrollToSection';
import { useRef } from 'react';

export default function ScheduleSection() {
  const contributorsSectionRef = useRef<HTMLDivElement>(null)
  const scrollStyle = useScrollToSection(contributorsSectionRef, "schedule")

  return (
    <>
      <div 
      className="schedule" 
       ref={contributorsSectionRef} 
       id="schedule" 
       style={scrollStyle}
       >
        <div className="schedule__hdr">
          <h2>Event Calendar</h2>
          <div className="schedule__hdr__btn">
            <ShadowButton buttonColor="#ffffff" shadowColor="#156FF7" buttonHeight="48px" buttonWidth="172px" textColor='#0F172A'>
              <a href="https://submit.events.plnetwork.io/signin" target="_blank">
                Submit an Event
              </a>
            </ShadowButton>
            <ShadowButton buttonColor="#156FF7" shadowColor="#3DFEB1" buttonHeight="48px" buttonWidth="172px">
              <a href="https://events.plnetwork.com" target="_blank">
                Go to Events
              </a>
            </ShadowButton>
          </div>
        </div>
        <iframe src="https://pln-events-git-develop-protocol-labs-spaceport.vercel.app/embed/program/" className="schedule__iframe" title="Event Calendar"></iframe>
      </div>
      <style jsx>{`
        .schedule {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .schedule__hdr {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #ffffff;
        }
        .schedule__hdr__btn {
          display: flex;
          gap: 16px;
        }
        .schedule__iframe {
          width: 100%;
          height: 800px;
          border: none;
        }
      `}</style>
    </>
  );
}
