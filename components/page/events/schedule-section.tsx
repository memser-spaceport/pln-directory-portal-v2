'use client';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import ShadowButton from '@/components/ui/ShadowButton';
import { useScrollToSection } from '@/hooks/useScrollToSection';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
import { EVENTS_SUBSCRIPTION_URL } from '@/utils/constants';
import { useRef } from 'react';

export default function ScheduleSection(props: any) {
  const scheduleSectionRef = useRef<HTMLDivElement>(null)
  const { scrollMarginTop } = useScrollToSection(scheduleSectionRef, "schedule", 80)
  const { onSubmitEventButtonClicked, onGoToEventsButtonClicked, onSubscribeForUpdatesButtonClicked } = useEventsAnalytics();

  return (
    <>
      <div 
        className={`schedule`}
        ref={scheduleSectionRef} 
        id="schedule" 
        style={{ scrollMarginTop }}
      >
        <div className="schedule__hdr">
          <h2>Event Calendar</h2>
          <div className="schedule__hdr__btn">
          <a href={`${EVENTS_SUBSCRIPTION_URL}`} target="_blank" onClick={() => onSubscribeForUpdatesButtonClicked(getAnalyticsUserInfo(props.userInfo), null)}>
              <ShadowButton buttonColor="#ffffff" shadowColor="#156FF7" buttonHeight="48px" buttonWidth="172px" textColor='#0F172A'>
                Subscribe for updates
              </ShadowButton>
            </a>
            <a href={`${process.env.PL_EVENTS_SUBMISSION_URL}`} target="_blank" onClick={() => onSubmitEventButtonClicked(getAnalyticsUserInfo(props.userInfo), null)}>
              <ShadowButton buttonColor="#ffffff" shadowColor="#156FF7" buttonHeight="48px" buttonWidth="172px" textColor='#0F172A'>
                Submit an Event
              </ShadowButton>
            </a>
            <a href={`${process.env.PL_EVENTS_BASE_URL}/program`} target="_blank" onClick={() => onGoToEventsButtonClicked(getAnalyticsUserInfo(props.userInfo), null)}>
              <ShadowButton buttonColor="#156FF7" shadowColor="#3DFEB1" buttonHeight="48px" buttonWidth="172px">
                Go to Events
              </ShadowButton>
            </a>
          </div>
        </div> 
        <iframe src={`${process.env.PL_EVENTS_BASE_URL}/embed/program/`} className="schedule__iframe" title="Event Calendar"></iframe>
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
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          background-color: #ffffff;
          padding: 10px;
          width: 100%;
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
        
        @media (min-width: 768px) {
          .schedule__hdr {
            flex-direction: row;
          }
        }
      `}</style>
    </>
  );
}
