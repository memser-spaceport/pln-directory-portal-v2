"use client"

import Link from "next/link"

export default function EventsBanner() {
  return (
    <section className="banner">
      <div className="content-container">
        <div className="text-content">
          <h1>Welcome to Protocol Labs Network Events</h1>
          <p>Explore upcoming events, join IRL gatherings, and connect with teams across the ecosystem.</p>
        </div>
        <div className="buttons-container">
          <button className="button gatherings-button">
            <Link href="#">
              See all Gatherings
            </Link>
          </button>
          <button className="button events-button">
            <Link href="#" className="button-link">
              See all Events <img src="/icons/open-link.svg" alt="Open link" width={16} height={16} className="icon" />
            </Link>
          </button>
        </div>
      </div>

      <style jsx>{`
        .banner {
          position: relative;
          width: 100%;
          min-height: 400px;
          background-image: url('/images/events/events-banner.svg');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        .button-link {
          color: #0f172a;
        }

        .content-container {
          // background-image: url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Events_Exploration-T1nu4FADYiF1RVhiK7sA3JCFGEnarL.png');
          background-size: cover;
          background-position: center;
          background-blend-mode: overlay;
          background-color: rgba(0, 0, 0, 0.2);
          background: linear-gradient(180deg, rgba(2, 88, 137, 0.6) 22%, rgba(0, 36, 68, 0.6) 79.5%);
          backdrop-filter: blur(4px);
          border-radius: 16px;
          max-width: 800px;
          width: 100%;
          padding: 2.5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .text-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        h1 {
          color: #ffffff;
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 0;
        }

        p {
          color: #ffffff;
          font-size: 1.125rem;
          line-height: 1.5;
          margin: 0;
          opacity: 0.9;
        }

        .buttons-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .button:hover {
          transform: translateY(-2px);
          box-shadow: 7px 7px 0px rgba(61, 254, 177, 0.8);
        }

        .gatherings-button {
          background-color: #156ff7;
          color: #ffffff;
          box-shadow: 5px 5px 0px rgba(61, 254, 177, 0.8);
          border: 1px solid #000000;
        }

        .events-button {
          background-color: #3dfeb1;
          color: #0f172a;
          box-shadow: 5px 5px 0px rgba(21, 111, 247, 0.8);
          border: 1px solid #000000;
        }

        .events-button:hover {
          box-shadow: 7px 7px 0px rgba(21, 111, 247, 0.8);
        }

        .icon {
          width: 16px;
          height: 16px;
        }

        @media (max-width: 768px) {
          .content-container {
            padding: 2rem 1.5rem;
          }

          h1 {
            font-size: 2rem;
          }

          p {
            font-size: 1rem;
          }

          .buttons-container {
            flex-direction: column;
            width: 100%;
            max-width: 300px;
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
