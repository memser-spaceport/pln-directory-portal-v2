'use client';

import Image from 'next/image';
import { DisclaimerSectionData } from '../types';

interface DisclaimerSectionProps {
  data: DisclaimerSectionData;
}

/**
 * DisclaimerSection - Displays legal disclaimer with disclosure link
 * @param data - Disclaimer section data from master JSON
 */
export default function DisclaimerSection({ data }: DisclaimerSectionProps) {
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
            <a href={data.disclosureUrl} className="disclaimer-section__link" target="_blank" rel="noopener noreferrer">disclosure</a>.</em>
          </p>
        </div>
      </section>

      <style jsx>{`
        .disclaimer-section {
          width: 100%;
        }

        .disclaimer-section__container {
          padding: 24px;
          background: linear-gradient(22.19deg, rgba(66, 125, 255, 0.05) 8.43%, rgba(68, 213, 187, 0.05) 87.45%);
          border: 1px solid #427dff;
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
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
          color: #0f172a;
        }

        .disclaimer-section__text {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          font-style: italic;
          line-height: 21px;
          color: #64748b;
          margin: 0;
        }

        .disclaimer-section__link {
          color: #156ff7;
          text-decoration: underline;
          text-underline-position: from-font;
          font-style: italic;
        }

        .disclaimer-section__link:hover {
          text-decoration: none;
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
