'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getTokenBalance } from '@/app/actions/plaa-token-balance.actions';
import { TokenDashboardData } from '../types';

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

function InlineLoader({
  isLoading,
  width,
  height,
  children,
}: {
  isLoading: boolean;
  width: string;
  height: string;
  children: React.ReactNode;
}) {
  if (isLoading) {
    return (
      <>
        <span className="token-dashboard__skeleton" style={{ width, height }} />
        <style jsx>{`
          .token-dashboard__skeleton {
            display: inline-block;
            border-radius: 4px;
            background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
            background-size: 200% 100%;
            animation: skeleton-shimmer 1.5s ease-in-out infinite;
          }

          @keyframes skeleton-shimmer {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
        `}</style>
      </>
    );
  }

  return <>{children}</>;
}

export default function TokenDashboardSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<TokenDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchTokenBalance = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    const result = await getTokenBalance();
    if (result.isError || !result.data) {
      setHasError(true);
    } else {
      setData(result.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTokenBalance();
  }, [fetchTokenBalance]);

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  return (
    <>
      <section className="token-dashboard">
        {/* Collapsed / Header Bar */}
        <button
          className="token-dashboard__header"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
          aria-controls="token-dashboard-content"
        >
          <div className="token-dashboard__header-left">
            <h2 className="token-dashboard__title">Token Dashboard</h2>
            {!isExpanded && (
              <span className="token-dashboard__status-badge">
                <span className="token-dashboard__status-badge__label">Settlement Election Status:</span>
                <InlineLoader isLoading={isLoading} width="70px" height="16px">
                  <span className="token-dashboard__status-badge__value">{data?.settlementElectionStatus ?? '—'}</span>
                </InlineLoader>
              </span>
            )}
          </div>
          <Image
            src="/icons/chevron-up.svg"
            alt={isExpanded ? 'Collapse' : 'Expand'}
            width={20}
            height={20}
            className={`token-dashboard__chevron ${isExpanded ? 'token-dashboard__chevron--expanded' : ''}`}
          />
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="token-dashboard__body" id="token-dashboard-content">
            <p className="token-dashboard__welcome">
              Welcome back [User] - here are your updated token balances from Surus
            </p>

            {hasError ? (
              <div className="token-dashboard__error">
                <p>Unable to load token balance. Please try again later.</p>
                <button className="token-dashboard__retry-btn" onClick={fetchTokenBalance}>
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* My Tokens Card */}
                <div className="token-dashboard__card">
                  <div className="token-dashboard__card-header">
                    <span className="token-dashboard__card-label">MY TOKENS</span>
                    <span className="token-dashboard__card-updated">
                      LAST UPDATED{' '}
                      <InlineLoader isLoading={isLoading} width="180px" height="16px">
                        {data?.lastUpdated}
                      </InlineLoader>
                    </span>
                  </div>

                  <div className="token-dashboard__token-total">
                    <span className="token-dashboard__token-total__amount">
                      <InlineLoader isLoading={isLoading} width="140px" height="40px">
                        {formatNumber(data?.totalTokens ?? 0)}
                      </InlineLoader>
                    </span>
                    <span className="token-dashboard__token-total__name">PLAA1 Tokens</span>
                  </div>

                  <p className="token-dashboard__token-description">
                  Tokens Available to Bid in Buyback Auctions
                  </p>

                  <div className="token-dashboard__badges">
                    <span className="token-dashboard__badge token-dashboard__badge--election">
                      <span className="token-dashboard__badge__label">Settlement Election:</span>
                      <InlineLoader isLoading={isLoading} width="70px" height="16px">
                        <span className="token-dashboard__badge__value">{data?.settlementElectionStatus}</span>
                      </InlineLoader>
                    </span>
                    <span className="token-dashboard__badge token-dashboard__badge--elected">
                      <span className="token-dashboard__badge__label">Elected On:</span>
                      <InlineLoader isLoading={isLoading} width="90px" height="16px">
                        <span className="token-dashboard__badge__elected-value">{data?.electedOn}</span>
                      </InlineLoader>
                    </span>
                  </div>

                  {/* Stat Cards */}
                  <div className="token-dashboard__stats">
                    <div className="token-dashboard__stat-card">
                      <div className="token-dashboard__stat-card__header">
                        <div className="token-dashboard__stat-card__icon-group">
                          <Image src="/icons/plaa/notepad.svg" alt="" width={15} height={18} />
                          <span className="token-dashboard__stat-card__label">ENTITLED</span>
                        </div>
                        <div className="token-dashboard__stat-card__info-wrap token-dashboard__stat-card__info-wrap--tooltip">
                          <Image src="/icons/rounds/info-gray.svg" alt="Info" width={16} height={16} />
                          <span className="token-dashboard__tooltip">
                            Gross Tokens You&apos;re Entitled To Upon Settlement
                          </span>
                        </div>
                      </div>
                      <span className="token-dashboard__stat-card__value">
                        <InlineLoader isLoading={isLoading} width="100px" height="34px">
                          {formatNumber(data?.entitledTokens ?? 0)}
                        </InlineLoader>
                      </span>
                    </div>

                    <div className="token-dashboard__stat-card">
                      <div className="token-dashboard__stat-card__header">
                        <div className="token-dashboard__stat-card__icon-group">
                          <Image src="/icons/plaa/link.svg" alt="" width={17} height={9} />
                          <span className="token-dashboard__stat-card__label">SETTLED</span>
                        </div>
                        <div className="token-dashboard__stat-card__info-wrap token-dashboard__stat-card__info-wrap--tooltip">
                          <Image src="/icons/rounds/info-gray.svg" alt="Info" width={16} height={16} />
                          <span className="token-dashboard__tooltip">
                            Tokens Currently Settled To You
                          </span>
                        </div>
                      </div>
                      <span className="token-dashboard__stat-card__value">
                        <InlineLoader isLoading={isLoading} width="100px" height="34px">
                          {formatNumber(data?.settledTokens ?? 0)}
                        </InlineLoader>
                      </span>
                    </div>

                    <div className="token-dashboard__stat-card">
                      <div className="token-dashboard__stat-card__header">
                        <div className="token-dashboard__stat-card__icon-group">
                          <Image src="/icons/plaa/cart.svg" alt="" width={17} height={17} />
                          <span className="token-dashboard__stat-card__label">SOLD</span>
                        </div>
                        <div className="token-dashboard__stat-card__info-wrap token-dashboard__stat-card__info-wrap--tooltip">
                          <Image src="/icons/rounds/info-gray.svg" alt="Info" width={16} height={16} />
                          <span className="token-dashboard__tooltip">Cumulative Tokens Sold During Buybacks</span>
                        </div>
                      </div>
                      <span className="token-dashboard__stat-card__value">
                        <InlineLoader isLoading={isLoading} width="100px" height="34px">
                          {formatNumber(data?.soldTokens ?? 0)}
                        </InlineLoader>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="token-dashboard__disclaimer">
                  <div className="token-dashboard__disclaimer__content">
                    <Image
                      src="/icons/rounds/info-gray.svg"
                      alt=""
                      width={16}
                      height={16}
                      className="token-dashboard__disclaimer__icon"
                    />
                    <p className="token-dashboard__disclaimer__text">
                      <strong>Disclaimer:</strong> <em>Token balances displayed here are determined by Surus.</em>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <style jsx>{`
        .token-dashboard {
          width: 100%;
          border-radius: 16px;
          padding: 32px;
          background: #f8fafc;
          overflow: hidden;
          position: relative;
        }

        /* ---- Header (collapsed bar) ---- */
        .token-dashboard__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: transparent;
          border: none;
          cursor: pointer;
          gap: 16px;
        }

        .token-dashboard__header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .token-dashboard__title {
          font-size: 20px;
          font-weight: 600;
          line-height: 24px;
          color: #0f172a;
          margin: 0;
          white-space: nowrap;
        }

        .token-dashboard__status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          font-size: 13px;
          line-height: 18px;
        }

        .token-dashboard__status-badge__label {
          color: #64748b;
          font-weight: 400;
        }

        .token-dashboard__status-badge__value {
          color: #10b981;
          font-weight: 600;
        }

        /* ---- Body (expanded) ---- */
        .token-dashboard__body {
          // padding: 0 24px 24px 28px;
          padding-top: 12px;
        }

        .token-dashboard__welcome {
          font-size: 14px;
          font-weight: 400;
          line-height: 28px;
          color: #64748b;
          margin: 0 0 24px 0;
        }

        .token-dashboard__error {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px;
          color: #64748b;
          font-size: 14px;
        }

        .token-dashboard__retry-btn {
          padding: 8px 20px;
          border-radius: 8px;
          border: 1px solid #156ff7;
          background: transparent;
          color: #156ff7;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .token-dashboard__retry-btn:hover {
          background: #f1f5f9;
        }

        /* ---- My Tokens Card ---- */
        .token-dashboard__card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0px 1px 3px rgba(15, 23, 42, 0.04);
        }

        .token-dashboard__card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .token-dashboard__card-label {
          font-size: 14px;
          font-weight: 700;
          color: #156ff7;
        }

        .token-dashboard__card-updated {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 400;
          color: #94a3b8;
          letter-spacing: 0.3px;
        }

        /* ---- Token Total ---- */
        .token-dashboard__token-total {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 8px;
        }

        .token-dashboard__token-total__amount {
          font-size: 36px;
          font-weight: 700;
          line-height: 48px;
          color: #0f172a;
        }

        .token-dashboard__token-total__name {
          font-size: 20px;
          line-height: 32px;
          font-weight: 600;
          color: #94a3b8;
        }

        .token-dashboard__token-description {
          font-size: 16px;
          font-weight: 400;
          line-height: 24px;
          color: #475569;
          margin: 0 0 12px 0;
        }

        /* ---- Badges ---- */
        .token-dashboard__badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .token-dashboard__badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          line-height: 14px;
        }

        .token-dashboard__badge__label {
          color: #64748b;
          font-weight: 400;
        }

        .token-dashboard__badge__value {
          color: #10b981;
          font-weight: 600;
        }

        .token-dashboard__badge__elected-value {
          color: #475569;
          font-weight: 500;
        }

        /* ---- Stat Cards ---- */
        .token-dashboard__stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .token-dashboard__stat-card {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .token-dashboard__stat-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .token-dashboard__stat-card__icon-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .token-dashboard__stat-card__label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          color: #475569;
        }

        .token-dashboard__stat-card__info-wrap {
          position: relative;
          display: flex;
          align-items: center;
          cursor: default;
        }

        .token-dashboard__stat-card__info-wrap--tooltip:hover .token-dashboard__tooltip {
          opacity: 1;
          visibility: visible;
        }

        .token-dashboard__tooltip {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 0;
          background: #1e293b;
          color: #ffffff;
          font-size: 12px;
          font-weight: 400;
          line-height: 16px;
          padding: 8px 12px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition:
            opacity 0.15s ease,
            visibility 0.15s ease;
          pointer-events: none;
          z-index: 10;
        }

        .token-dashboard__stat-card__value {
          font-size: 28px;
          font-weight: 700;
          line-height: 34px;
          color: #0f172a;
        }

        /* ---- Disclaimer ---- */
        .token-dashboard__disclaimer {
          margin-top: 24px;
          border-radius: 8px;
          position: relative;
          z-index: 1;
        }

        .token-dashboard__disclaimer::before {
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

        .token-dashboard__disclaimer__content {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 20px;
          background: linear-gradient(22.19deg, rgba(66, 125, 255, 0.05) 8.43%, rgba(68, 213, 187, 0.05) 87.45%);
          border-radius: 8px;
        }

        .token-dashboard__disclaimer__text {
          font-size: 14px;
          font-weight: 400;
          line-height: 20px;
          color: #64748b;
          margin: 0;
        }

        .token-dashboard__disclaimer__text strong {
          color: #0f172a;
          font-weight: 600;
        }

        /* ---- Responsive ---- */
        @media (max-width: 768px) {
          .token-dashboard__header {
            padding: 16px 16px 16px 20px;
          }

          .token-dashboard__body {
            // padding: 0 16px 16px 20px;
          }

          .token-dashboard__card {
            padding: 16px;
          }

          .token-dashboard__token-total__amount {
            font-size: 28px;
            line-height: 34px;
          }

          .token-dashboard__token-total__name {
            font-size: 14px;
          }

          .token-dashboard__stats {
            grid-template-columns: 1fr;
          }

          .token-dashboard__stat-card__value {
            font-size: 22px;
            line-height: 28px;
          }

          .token-dashboard__card-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <style jsx global>{`
        .token-dashboard__chevron {
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .token-dashboard__chevron--expanded {
          transform: rotate(180deg);
        }

        .token-dashboard__disclaimer__icon {
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
}
