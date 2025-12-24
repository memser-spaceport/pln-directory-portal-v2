'use client';

import Image from 'next/image';
import { DISCLOSURE_URL } from '@/constants/plaa';

export default function DisclaimerSection() {
  return (
    <>
      <section className="disclaimer-section">
        <div className="disclaimer-section__container">
          <div className="disclaimer-section__header">
            <Image src="/icons/rounds/info-gray.svg" alt="" width={16} height={16} className="disclaimer-section__icon" />
            <span className="disclaimer-section__title">Disclaimer:</span>
          </div>
          
          <p className="disclaimer-section__text">
            <em>The Alignment Asset is still in private beta, and we&apos;re actively experimenting. The points program may evolve at any time as we learn and improve. While the alignment asset trust ultimately controls token distributions, and we cannot guarantee the conversion of points to tokens, your participation now puts you at the forefront of this exciting initiative. This is for informational purposes only, and is not legal, financial, investment, or tax advice. Please read our{' '}
            <a href={DISCLOSURE_URL} className="disclaimer-section__link" target="_blank" rel="noopener noreferrer">disclosure</a>.</em>
          </p>
        </div>
      </section>

      <style jsx>{`
        .disclaimer-section {
          border-radius: 15px;
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 1;
        }

        .disclaimer-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 8px;
          border: 1.5px solid transparent;
          background: linear-gradient(71.47deg, #427dff 8.43%, #44d5bb 87.45%) border-box;
          -webkit-mask:
            linear-gradient(#fff 0 0) padding-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: destination-out;
          mask-composite: exclude;
          pointer-events: none;
        }

        .disclaimer-section__container {
          padding: 24px;
          background: linear-gradient(22.19deg, rgba(66, 125, 255, 0.05) 8.43%, rgba(68, 213, 187, 0.05) 87.45%);
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .disclaimer-section__header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .disclaimer-section__icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .disclaimer-section__title {
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
          color: #0f172a;
        }

        .disclaimer-section__text {
          font-size: 15px;
          font-weight: 400;
          font-style: italic;
          line-height: 21px;
          color: #64748b;
          margin: 0;
        }

        .disclaimer-section__link {
          color: #156ff7;
          text-decoration: underline;
          font-style: italic;
          cursor: pointer;
          position: relative;
          z-index: 2;
        }

        @media (max-width: 768px) {
          .disclaimer-section__container {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
