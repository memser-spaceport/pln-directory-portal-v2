"use client"

import ShadowButton from "@/components/ui/ShadowButton"
import { PAGE_ROUTES } from "@/utils/constants"
import { useEventsAnalytics } from "@/analytics/events.analytics"
import { getAnalyticsUserInfo } from "@/utils/common.utils";

export default function EventsBanner(props: any) {
  const { onViewAllGatheringsClicked, onViewAllEventsClicked } = useEventsAnalytics();

  return (
    <section className="banner">
      {/* Banner background image */}
      <div className="banner-image-container">
        <img 
          src="/images/events/events-banner.svg" 
          alt="Events Banner" 
          className="banner-image" 
          loading="eager"
        />
      </div>
      
      <div className="content-container">
        {/* Text content section */}
        <div className="text-content">
          <div className="text-content-title">Welcome to Protocol Labs Events</div>
          <div className="text-content-description">Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem</div>
        </div>
        {/* Navigation buttons section */}
        <div className="buttons-container">
          {/* Button to view gatherings */}
          <a href={PAGE_ROUTES.IRL} onClick={() => onViewAllGatheringsClicked()} data-testid="gatherings-link">
            <ShadowButton
              buttonColor="#156FF7"
              shadowColor="#3DFEB1"
              buttonHeight="48px"
              buttonWidth="172px"
            >
              View Gatherings
            </ShadowButton>
          </a>
          {/* Button to view all events */}
          <a href={`${process.env.PL_EVENTS_BASE_URL}/program`} target="_blank" className="button-link" onClick={() => onViewAllEventsClicked()} data-testid="events-link">
            <ShadowButton
              buttonColor="#3DFEB1"
              shadowColor="#156FF7"
              iconPosition="right"
              iconSrc="/icons/black-link-up-arrow.svg"
              iconAlt="Open link"
              iconWidth={16}
              iconHeight={16}
              buttonHeight="48px"
              buttonWidth="172px"
              textColor="#0F172A"
            > 
              View all Events
            </ShadowButton>
          </a>
        </div>
      </div>

      <style jsx>{`
        .banner {
          position: relative;
          width: 100%;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          overflow: hidden;
        }
        
        .banner-image-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
        }
        
        .banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .button-link {
          color: #0f172a;
        }

        .content-container {
          background: linear-gradient(180deg, rgba(2, 88, 137, 0.6) 22%, rgba(0, 36, 68, 0.6) 79.5%);
          border-radius: 16px;
          max-width: 715px;
          padding: 2.5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          position: relative;
          z-index: 1;
          overflow: hidden;
        }

        .content-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 16px; 
          border: 1px solid transparent;
          background: linear-gradient(180deg, #70ECFF 0%, #5EE3B5 100%) border-box;
          -webkit-mask:
            linear-gradient(#fff 0 0) padding-box, 
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
        }

        .text-content {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .text-content-description {
          color: #ffffff;
          font-weight: 400;
          font-size: 16px;
          line-height: 24px;
          letter-spacing: 0%;
          text-align: center;
          width: 75%;
        }

        .text-content-title {
          font-weight: 800;
          font-size: 40px;
          line-height: 48px;
          letter-spacing: 0%;
          text-align: center;
          color: #ffffff;
        }

        .buttons-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        @media (max-width: 508px) {
          .content-container {
            padding: 24px;
          }

          .text-content-title {
            font-size: 22px;
            line-height: 30px;
          }

          .text-content-description {
            font-size: 14px;
            line-height: 18px;
            width: 100%;
          }

          .buttons-container {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
            align-items: center;
          }

          .button {
            width: 100%;
          }
        }

        @media (min-width: 360px) and (max-width: 480px) {
          .banner {
            min-height: 500px;
          }

          h1 {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </section>
  )
}
