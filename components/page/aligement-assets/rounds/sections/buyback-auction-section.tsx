'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BuybackAuctionSectionData } from '../types';

interface BuybackAuctionSectionProps {
  data: BuybackAuctionSectionData;
}

/**
 * BuybackAuctionSection - Displays buyback auction results and bid table
 * @param data - Buyback auction data from master JSON
 */
export default function BuybackAuctionSection({ data }: BuybackAuctionSectionProps) {
  const [visibleBids, setVisibleBids] = useState(10);
  
  const visibleBidData = data.bids.slice(0, visibleBids);
  const hasMore = data.bids.length > visibleBids;
  const remainingCount = data.bids.length - visibleBids;

  const handleShowMore = () => {
    setVisibleBids(prev => prev + 10);
  };

  return (
    <>
      <section className="buyback-section">
        <div className="buyback-section__container">
          {/* Header */}
          <div className="buyback-section__header">
            <div className="buyback-section__header-left">
              <h2 className="buyback-section__title">Buyback Auction Results</h2>
              <p className="buyback-section__description">
                Below is a summary of the key outcomes from the most recent Buyback Auction — the clearing price, how much of the buyback pool was used, the number of winning bidders, and the total tokens purchased.
              </p>
            </div>
            <div className="buyback-section__header-right">
              <div className="buyback-section__stat">
                <span className="buyback-section__stat-label">Total Filled</span>
                <span className="buyback-section__stat-value buyback-section__stat-value--calculating">{data.headerStats.totalFilled}</span>
              </div>
              <div className="buyback-section__stat-divider" />
              <div className="buyback-section__stat">
                <span className="buyback-section__stat-label">Fill Rate</span>
                <span className="buyback-section__stat-value">{data.headerStats.fillRate}</span>
              </div>
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

          {/* Auction Table */}
          <div className={`buyback-section__table-container ${!hasMore ? 'buyback-section__table-container--no-more' : ''}`}>
            <table className="buyback-section__table">
              <thead>
                <tr className="buyback-section__table-header-row">
                  <th className="buyback-section__th">BIDDER ID</th>
                  <th className="buyback-section__th">TOKENS BID</th>
                  <th className="buyback-section__th">TOKEN PRICE</th>
                  <th className="buyback-section__th">
                    <div className="buyback-section__th-with-icon">
                      <Image src="/icons/rounds/info-gray.svg" alt="" width={16} height={16} />
                      BID VALUE
                    </div>
                  </th>
                  <th className="buyback-section__th">STATUS</th>
                  <th className="buyback-section__th">AMT FILLED</th>
                  <th className="buyback-section__th">ACCEPTED</th>
                  <th className="buyback-section__th">AGG FILL</th>
                  <th className="buyback-section__th">% CAPTURE</th>
                </tr>
              </thead>
              <tbody>
                {visibleBidData.map((bid, index) => (
                  <tr key={`${bid.bidderId}-${bid.tokenPrice}-${index}`} className={`buyback-section__table-row ${index === visibleBidData.length - 1 && !hasMore ? 'buyback-section__table-row--last' : ''}`}>
                    <td className="buyback-section__td">{bid.bidderId}</td>
                    <td className="buyback-section__td">{bid.tokensBid}</td>
                    <td className="buyback-section__td buyback-section__td--bold">{bid.tokenPrice}</td>
                    <td className="buyback-section__td">{bid.bidValue}</td>
                    <td className="buyback-section__td">
                      <span className={`buyback-section__status buyback-section__status--${bid.status === 'Fully Filled' ? 'filled' : 'partial'}`}>
                        {bid.status}
                      </span>
                    </td>
                    <td className="buyback-section__td buyback-section__td--bold">{bid.amtFilled}</td>
                    <td className="buyback-section__td buyback-section__td--accent">{bid.accepted}</td>
                    <td className="buyback-section__td">{bid.aggFill}</td>
                    <td className="buyback-section__td">
                      <div className="buyback-section__capture">
                        <div className="buyback-section__capture-bar">
                          <div 
                            className="buyback-section__capture-fill" 
                            style={{ width: `${parseFloat(bid.percentCapture)}%` }}
                          />
                        </div>
                        <span className="buyback-section__capture-value">{bid.percentCapture}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Show More Button */}
            {hasMore && (
              <div className="buyback-section__show-more">
                <button className="buyback-section__show-more-btn" onClick={handleShowMore}>
                  <span>Show +{Math.min(10, remainingCount)} more</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 6L8 10L12 6" stroke="#156FF7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            )}
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
          align-items: flex-start;
          gap: 42px;
        }

        .buyback-section__header-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          max-width: 867px;
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
        }

        .buyback-section__header-right {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          flex-shrink: 0;
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

        .buyback-section__stat-divider {
          width: 1px;
          height: 48px;
          background-color: #e2e8f0;
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

        .buyback-section__table-container {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          background-color: white;
        }

        .buyback-section__table-container--no-more .buyback-section__table-row--last {
          border-bottom: none;
        }

        .buyback-section__table {
          width: 100%;
          border-collapse: collapse;
        }

        .buyback-section__table-header-row {
          background-color: #f9fafb;
        }

        .buyback-section__th {
          font-size: 12px;
          font-weight: 500;
          line-height: 16px;
          color: #64748b;
          text-align: left;
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .buyback-section__th-with-icon {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .buyback-section__table-row {
          border-bottom: 1px solid #e2e8f0;
        }

        .buyback-section__td {
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #374151;
          padding: 24px 16px;
          vertical-align: middle;
        }

        .buyback-section__td--bold {
          font-weight: 600;
          color: #0f172a;
        }

        .buyback-section__td--accent {
          color: #10b981;
        }

        .buyback-section__status {
          display: inline-flex;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
          line-height: 16px;
        }

        .buyback-section__status--filled {
          background-color: #dcfce7;
          color: #16a34a;
        }

        .buyback-section__status--partial {
          background-color: #fef3c7;
          color: #d97706;
        }

        .buyback-section__capture {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .buyback-section__capture-bar {
          width: 50px;
          height: 4px;
          background-color: #e2e8f0;
          border-radius: 2px;
          overflow: hidden;
        }

        .buyback-section__capture-fill {
          height: 100%;
          background-color: #fbbf24;
          border-radius: 2px;
        }

        .buyback-section__capture-value {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #475569;
        }

        .buyback-section__show-more {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background-color: white;
          border-top: 1px solid #e2e8f0;
        }

        .buyback-section__show-more-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          line-height: 20px;
          color: #156ff7;
          cursor: pointer;
        }

        .buyback-section__show-more-btn:hover {
          text-decoration: underline;
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

          .buyback-section__table-container {
            overflow-x: auto;
          }

          .buyback-section__table {
            min-width: 1000px;
          }
        }

        @media (max-width: 768px) {
          .buyback-section__header-right {
            width: 100%;
            justify-content: space-between;
          }

          .buyback-section__summary-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
