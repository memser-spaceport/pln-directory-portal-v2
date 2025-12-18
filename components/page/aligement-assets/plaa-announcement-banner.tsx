'use client';

/* ==========================================================================
   PlaaAnnouncementBanner Component
   Fixed announcement banner at the top of the PLAA pages
   ========================================================================== */

interface PlaaAnnouncementBannerProps {
  message?: string;
}

function PlaaAnnouncementBanner({
  message = ""
}: PlaaAnnouncementBannerProps) {
  return (
    <>
      <div className="plaa-banner" role="banner" aria-label="Announcement">
        <p className="plaa-banner__text">{message}</p>
      </div>
      <style jsx>
        {`
          /* =================================================================
             Announcement Banner - Figma Design
             Height: 56px, Background: #156ff7 (Primary/Blue600)
             ================================================================= */

          .plaa-banner {
            width: 100%;
            height: 56px;
            background-color: #156ff7;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px 16px;
          }

          .plaa-banner__text {
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            color: #ffffff;
            line-height: 36px;
            text-align: center;
          }

          @media (min-width: 768px) {
            .plaa-banner__text {
              font-size: 16px;
            }
          }
        `}
      </style>
    </>
  );
}

export default PlaaAnnouncementBanner;
