'use client';

import Image from 'next/image';
import { BuybackSimulationSectionData } from '../types';

interface BuybackAuctionSectionProps {
  data: BuybackSimulationSectionData;
}

/**
 * BuybackAuctionSection - Displays buyback auction results (header + summary
 * cards). The per-bid order book that used to sit below the summary was
 * removed; `data.bids` is still populated by the rounds API and left in the
 * type, but nothing renders it.
 * @param data - Buyback auction data from master JSON
 */
export default function BuybackAuctionSection({ data }: BuybackAuctionSectionProps) {
  return (
    <>
      <section className="buyback-section">
        <div className="buyback-section__container">
          {/* Header */}
          <div className="buyback-section__header">
            <div className="buyback-section__header-left">
              <h2 className="buyback-section__title">{data.title}</h2>
              <p className="buyback-section__description">
                {data.headerDescription}
              </p>
            </div>
            <div className="buyback-section__stat">
              <span className="buyback-section__stat-label">Total Filled</span>
              <span className={`buyback-section__stat-value ${data.totalFilled === 'Calculating...' ? 'buyback-section__stat-value--calculating' : ''}`}>
                {data.totalFilled}
              </span>
            </div>
          </div>

          {/* Auction Summary Box */}
          <div className="buyback-section__summary">
            <h3 className="buyback-section__summary-title">{data.summary.title}</h3>
            <div className="buyback-section__summary-grid">
              {data.summary.items.map((item, index) => (
                <div key={`${item.label}-${item.value}`} className="buyback-section__summary-item">
                  <div className="buyback-section__summary-item-header">
                    <Image src={item.icon} alt="" width={16} height={16} />
                    <span className="buyback-section__summary-item-label">{item.label}</span>
                  </div>
                  <span className="buyback-section__summary-item-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .buyback-section {
          width: 100%;
        }

        .buyback-section__container {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .buyback-section__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 48px;
        }

        .buyback-section__header-left {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }

        .buyback-section__title {
          font-size: 20px;
          font-weight: 600;
          line-height: normal;
          color: #16161f;
          margin: 0;
        }

        .buyback-section__description {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
          margin: 0;
          /* header_description is authored in Airtable, where line breaks are
             deliberate. pre-line honours them while still collapsing runs of
             spaces and wrapping normally. */
          white-space: pre-line;
        }

        .buyback-section__stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .buyback-section__stat-label {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #64748b;
        }

        .buyback-section__stat-value {
          font-size: 20px;
          font-weight: 600;
          line-height: normal;
          color: #0f172a;
        }

        .buyback-section__stat-value--calculating {
          color: #30c593;
        }

        .buyback-section__summary {
          background-color: transparent;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
        }

        .buyback-section__summary-title {
          font-size: 16px;
          font-weight: 600;
          line-height: normal;
          color: #0f172a;
          margin: 0 0 21px 0;
        }

        .buyback-section__summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .buyback-section__summary-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          background-color: #f8fafc;
          border-radius: 8px;
        }

        .buyback-section__summary-item-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .buyback-section__summary-item-label {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #64748b;
        }

        .buyback-section__summary-item-value {
          font-size: 18px;
          font-weight: 500;
          line-height: normal;
          color: #0f172a;
        }

        @media (max-width: 1200px) {
          .buyback-section__header {
            flex-direction: column;
            gap: 24px;
          }

          .buyback-section__header-left {
            max-width: 100%;
          }

          .buyback-section__summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .buyback-section__header-right {
            width: 100%;
          }

          .buyback-section__summary-grid {
            grid-template-columns: 1fr;
          }
          .buyback-section__summary {
            padding: 16px;
          }
        }
      `}</style>
    </>
  );
}
