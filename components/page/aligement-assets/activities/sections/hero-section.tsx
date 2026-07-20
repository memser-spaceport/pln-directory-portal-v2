'use client';

interface HeroSectionProps {
  data: {
    title: string;
    description: string;
    note: string;
  };
}

/**
 * HeroSection - Displays the main title and description for activities page
 */
export default function HeroSection({ data }: HeroSectionProps) {
  return (
    <>
      <section className="activities-hero">
        <div className="activities-hero__content">
          <h1 className="activities-hero__title">{data.title}</h1>
          <p className="activities-hero__description">{data.description}</p>
          {data.note && <p className="activities-hero__note">{data.note}</p>}
        </div>
      </section>

      <style jsx>{`
        .activities-hero {
          width: 100%;
          text-align: center;
        }

        .activities-hero__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 26px;
          max-width: 1124px;
          margin: 0 auto;
        }

        .activities-hero__title {
          font-size: 20px;
          font-weight: 600;
          line-height: 28px;
          color: #16161F;
          margin: 0;
        }

        .activities-hero__description {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0;
        }

        .activities-hero__note {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .activities-hero {
            text-align: left;
          }

          .activities-hero__content {
            padding: 0 16px;
            align-items: flex-start;
          }

          .activities-hero__title {
            font-size: 20px;
            line-height: 24px;
          }
        }
      `}</style>
    </>
  );
}


