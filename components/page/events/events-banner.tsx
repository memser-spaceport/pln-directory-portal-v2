"use client"

import ShadowButton from "@/components/ui/ShadowButton"
import { PAGE_ROUTES } from "@/utils/constants"

export default function EventsBanner() {
  return (
    <section className="banner">
      <div className="banner-image-container">
        <img 
          src="/images/events/events-banner.svg" 
          alt="Events Banner" 
          className="banner-image" 
          loading="eager"
        />
      </div>
      
      <div className="content-container">
        <div className="text-content">
          <div className="text-content-title">Welcome to Protocol Labs Events</div>
          <div className="text-content-description">Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.</div>
        </div>
        <div className="buttons-container">
          <ShadowButton
            buttonColor="#156FF7"
            shadowColor="#3DFEB1"
            buttonHeight="48px"
            buttonWidth="172px"
          >
            <a href={PAGE_ROUTES.IRL} target="_blank">
              See all Gatherings
            </a>
          </ShadowButton>
          <ShadowButton
            buttonColor="#3DFEB1"
            shadowColor="#156FF7"
            iconPosition="right"
            iconSrc="/icons/open-link.svg"
            iconAlt="Open link"
            iconWidth={16}
            iconHeight={16}
            buttonHeight="48px"
            buttonWidth="172px"
            textColor="#0F172A"
          > 
            <a href={`https://events.plnetwork.io/program/`} target="_blank" className="button-link">
              See all Events
            </a>
          </ShadowButton>
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
          backdrop-filter: blur(4px);
          border-radius: 16px;
          max-width: 617px;
          padding: 2.5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          position: relative;
          z-index: 1;
          border: 1px solid transparent;
          // border-image: linear-gradient(180deg, #70ECFF 0%, #5EE3B5 100%);
          // border-image-slice: 1;
          overflow: hidden;
        }

        .text-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .text-content-description {
          color: #ffffff;
          font-weight: 400;
          font-size: 14px;
          line-height: 24px;
          letter-spacing: 0%;
          text-align: center;
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
