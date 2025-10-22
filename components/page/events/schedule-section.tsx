'use client';

import { useEventsAnalytics } from '@/analytics/events.analytics';
import ShadowButton from '@/components/ui/ShadowButton';
import { getAnalyticsUserInfo } from '@/utils/common.utils';
// import { EVENTS_SUBSCRIPTION_URL } from '@/utils/constants';

export default function ScheduleSection(props: any) {
  const { onSubmitEventButtonClicked, onGoToEventsButtonClicked, onSubscribeForUpdatesButtonClicked } =
    useEventsAnalytics();

  return (
    <>
      <div className={`schedule`} id="schedule">
        <div className="schedule__hdr">
          <h2>Event Calendar</h2>
          <div className="schedule__hdr__btn">
            {/* <a href={`${EVENTS_SUBSCRIPTION_URL}`} target="_blank" onClick={() => onSubscribeForUpdatesButtonClicked(getAnalyticsUserInfo(props.userInfo), null)}>
              <ShadowButton buttonColor="#ffffff" shadowColor="#156FF7" buttonHeight="48px" buttonWidth="172px" textColor="#0F172A">
                Subscribe for updates
              </ShadowButton>
            </a> */}
            <a
              href={`${process.env.IRL_SUBMIT_FORM_URL}/add`}
              target="_blank"
              onClick={() => onSubmitEventButtonClicked()}
            >
              <ShadowButton
                buttonColor="#ffffff"
                shadowColor="#156FF7"
                buttonHeight="48px"
                buttonWidth="172px"
                textColor="#0F172A"
                iconSrc="/icons/doc.svg"
              >
                Submit an Event
              </ShadowButton>
            </a>
            <a
              href={`${process.env.PL_EVENTS_BASE_URL}/program`}
              target="_blank"
              onClick={() => onGoToEventsButtonClicked()}
            >
              <ShadowButton
                buttonColor="#3DFEB1"
                shadowColor="#156FF7"
                buttonHeight="48px"
                buttonWidth="172px"
                textColor="#0F172A"
                iconPosition="right"
                iconWidth={12}
                iconHeight={12}
                iconSrc="/icons/black-link-up-arrow.svg"
              >
                View all Events
              </ShadowButton>
            </a>
          </div>
        </div>
        <iframe
          src={`${process.env.PL_EVENTS_BASE_URL}/embed/program/`}
          className="schedule__iframe"
          title="Event Calendar"
        ></iframe>
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
          justify-content: flex-start;
          gap: 12px;
          background-color: #ffffff;
          padding: 10px;
          width: 100%;
        }
        .schedule__hdr__btn {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .schedule__iframe {
          width: 100%;
          height: 800px;
          border: none;
        }

        @media (min-width: 768px) {
          .schedule__hdr {
            align-items: center;
            flex-direction: row;
            justify-content: space-between;
          }
        }
      `}</style>
    </>
  );
}
