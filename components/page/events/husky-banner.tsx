"use client"

import ShadowButton from "@/components/ui/ShadowButton"
import { getAnalyticsUserInfo } from "@/utils/common.utils"
import { PAGE_ROUTES } from "@/utils/constants"
import Link from "next/link"
import { useEventsAnalytics } from "@/analytics/events.analytics"

export default function HuskyBanner(props: any) {
  const analytics = useEventsAnalytics();

  return (
    <div 
      className="husky-banner"
    >
        {/* Section: Responsive images for web and mobile */}
        <div className="image-container">
          <img 
            src="/images/events/banner-bg-husky-web.jpg" 
            alt="Husky Banner Web" 
            className="web-image"
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
          <img 
            src="/images/events/banner-bg-husky-mob.jpg" 
            alt="Husky Banner Mobile" 
            className="mobile-image"
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        </div>

      <div className="content-container">
        <h2 className="banner-title">Have questions about events or contributors?</h2>

        <div className="button-container">
          {/* Ask Husky button with analytics */}
          <a href={PAGE_ROUTES.HUSKY} target="_blank" onClick={() => analytics.onAskHuskyButtonClicked()}>
            <ShadowButton
              buttonColor="#ffffff"
              shadowColor="#156FF7"
              iconSrc="/images/husky/husky.svg"
              iconAlt="husky"
              iconWidth={24}
              iconHeight={24}
              buttonHeight="48px"
              buttonWidth="172px"
              textColor="#156FF7"
            >
                Ask Husky
            </ShadowButton>
          </a>
        </div>
      </div>

      {/* Section styles */}
      <style jsx>{`
        .husky-banner {
          width: 100%;
          background-color: #eef8ff;
          padding: 1.5rem;
          border-radius: 0.5rem;
          border: 1px solid rgba(63, 132, 235, 0.2);
          position: relative;
          overflow: hidden;
        }

        .image-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .web-image, .mobile-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pattern-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        .pattern-square {
          position: absolute;
          width: 0.5rem;
          height: 0.5rem;
          border-radius: 0.125rem;
          opacity: 0.2;
        }

        .blue-square {
          background-color: #3f84eb;
        }

        .green-square {
          background-color: #3dfeb1;
        }

        .content-container {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          width: 100%;
        }

        .banner-title {
          font-size: 1.25rem;
          font-weight: 500;
          color: #FFFFFF;
        }

        .button-container {
          position: relative;
        }

        .button-shadow {
          position: absolute;
          top: 5px;
          left: 5px;
          width: 100%;
          height: 100%;
          background-color: #156FF7;
          border-radius: 0.5rem;
        }

        :global(.husky-button) {
          position: relative;
          background-color: white;
          border-color: #156ff7;
          color: #156ff7;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 0.5rem;
          padding: 0.75rem 1.5rem;
        }

        :global(.husky-button:hover) {
          background-color: white;
          color: #156ff7;
        }

        :global(.husky-icon) {
          color: #156ff7;
        }

        @media (min-width: 360px) {
          .web-image{
            display: none;
          }
          
          .mobile-image {
            display: block;
          }
        }

        @media (min-width: 1024px) {
          .mobile-image{
            display: none;
          }
          .web-image{
            display: block;
          }
        }
      `}</style>
    </div>
  )
} 