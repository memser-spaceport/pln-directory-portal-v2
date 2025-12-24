'use client';

import { useState } from 'react';
import Image from 'next/image';
import SupportSection from '@/components/page/aligement-assets/rounds/sections/support-section';

export interface VersionItem {
  text: string;
  subItems?: string[];
}

export interface VersionData {
  version: string;
  dateRange: string;
  added?: (string | VersionItem)[];
  changed?: (string | VersionItem)[];
  learned?: (string | VersionItem)[];
  launched?: (string | VersionItem)[];
}

const productVersions: VersionData[] = [
  {
    version: 'v0.4',
    dateRange: 'December 2025 - present',
    added: [
      'Digital assets unlocked for Trust contributions',
      'First live buyback auction (totaled $47,623.10 in assets)',
      'Launched the website',
      'Introduced LabWeek-only custom incentive experiments',
      'Hosted a workshop to design new custom incentive experiments for 2026',
      'Hosted our first AA community event in Buenos Aires',
    ],
    changed: [
      'Expanded cohort from 40 to XX participants',
      'Simplified onboarding materials',
      'Adopted HubSpot for email communications',
    ],
    learned: [
      {
        text: 'Live buyback auction results validated improvements made post-simulations:',
        subItems: [
          'Buyback increased the understanding of the token value',
          'Price discovery evolved: Clearing price adjusted from $20.40 -> $20.00 between the simulations and live auction',
        ],
      },
      'Still learning!',
    ],
  },
  {
    version: 'v0.2',
    dateRange: 'June 2025 - November 2025',
    added: [
      'First token issuance (49,219 PLAA1 tokens)',
      'Two buyback simulations',
      'Two new activities: Custom Incentive Experiment, Referral Program',
      'Trust NAV tracking',
      'Two new regions unlocked: Germany, Switzerland',
      'Launched Alignment Asset webpage',
      {
        text: 'New buyback auction mechanism: Per-bidder cap (50% of pool max) prevents any single participant from dominating allocation',
      },
      {
        text: 'New buyback auction mechanism: Each bid can only be filled up to the total value of that bid (Tokens Bid x Bid Price) ensures bidders cannot "game the system" by bidding unrealistically low prices to maximize tokens at higher payouts',
      },
    ],
    changed: [
      'Expanded cohort from 38 to 46 participants',
      'Simplified onboarding materials',
      'Increased activity options from 14 to 16',
      'Pay-as-bid to batch auction model',
    ],
    learned: [
      'Token issuance created tangible ownership sense',
      {
        text: 'Buyback simulation results validated improvements:',
        subItems: [
          'Simulated buyback increased the understanding of the token value',
          'More equitable distribution: increased winner count, no whale dominance',
          'Price discovery evolved: Clearing price adjusted from $20.40 -> $20.00 between rounds',
          'Fairness mechanisms worked without breaking auction dynamics',
        ],
      },
    ],
  },
  {
    version: 'v0.1',
    dateRange: 'February 2025 - May 2025',
    launched: [
      'First experiment with 38 participants',
      'Regions unlocked: U.S. accredited investors',
      '10 incentivized activities at launch',
      '+4 new incentivized activities introduced June 6, 2025',
      'Points tracking system',
      'Monthly snapshot periods',
    ],
    learned: [
      'Quick wins (Directory Profile) drove 55% of users to create or update their directory profile',
      'Recognitions nominations surfaced hidden contributions',
      'Onboarding friction too high (26.95% conversion rate)',
      'Lack of clarity in onboarding materials and process',
      'Confusion about points-to-tokens conversion',
      'Confusion about token value',
    ],
  },
];

export default function ProductVersionsPage() {
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({});
  const [expandAll, setExpandAll] = useState(false);

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => ({
      ...prev,
      [version]: !prev[version],
    }));
  };

  const handleExpandAll = () => {
    if (expandAll) {
      setExpandedVersions({});
    } else {
      const allVersions: Record<string, boolean> = {};
      productVersions.forEach((v) => {
        allVersions[v.version] = true;
      });
      setExpandedVersions(allVersions);
    }
    setExpandAll(!expandAll);
  };

  const renderList = (items: (string | VersionItem)[]) => {
    return (
      <ul className="product-versions__list">
        {items.map((item, index) => {
          const isObject = typeof item === 'object';
          const text = isObject ? item.text : item;
          const subItems = isObject ? item.subItems : null;

          return (
            <li key={index} className="product-versions__list__item">
              {text}
              {subItems && (
                <ul className="product-versions__list__sub">
                  {subItems.map((subItem, subIndex) => (
                    <li key={subIndex} className="product-versions__list__sub__item">
                      {subItem}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <div className="product-versions">
        <div className="product-versions__header">
          <h1 className="product-versions__header__title">Product Versions</h1>
        </div>

        <div className="product-versions__controls">
          <button className="product-versions__controls__expand-all" onClick={handleExpandAll}>
            {expandAll ? 'Collapse All' : 'Expand All'}
            <Image
              src="/icons/arrow-down-light.svg"
              alt=""
              width={12}
              height={12}
              className={`product-versions__controls__expand-all__icon ${expandAll ? 'product-versions__controls__expand-all__icon--expanded' : ''}`}
            />
          </button>
        </div>

        <div className="product-versions__versions-list">
          {productVersions.map((version) => {
            const isExpanded = expandedVersions[version.version];

            return (
              <div key={version.version} className="product-versions__version-card">
                <button
                  className="product-versions__version-card__button"
                  onClick={() => toggleVersion(version.version)}
                >
                  <div className="product-versions__version-card__header">
                    <span className="product-versions__version-card__version">{version.version}:</span>
                    <span className="product-versions__version-card__date">{version.dateRange}</span>
                  </div>
                  <Image
                    src={isExpanded ? '/icons/arrow-up.svg' : '/icons/arrow-down-light.svg'}
                    alt="Toggle"
                    width={14}
                    height={14}
                    className={`product-versions__chevron ${isExpanded ? 'product-versions__chevron--expanded' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="product-versions__version-card__content">
                    {version.launched && version.launched.length > 0 && (
                      <div className="product-versions__section">
                        <h3 className="product-versions__section__title product-versions__section__title--launched">
                          <Image src="/icons/launched-icon.png" alt="" width={16} height={16} />
                          Launched
                        </h3>
                        {renderList(version.launched)}
                      </div>
                    )}

                    {version.added && version.added.length > 0 && (
                      <div className="product-versions__section">
                        <h3 className="product-versions__section__title product-versions__section__title--added">
                          <Image src="/icons/added-icon.png" alt="" width={16} height={16} />
                          Added
                        </h3>
                        {renderList(version.added)}
                      </div>
                    )}

                    {version.changed && version.changed.length > 0 && (
                      <div className="product-versions__section">
                        <h3 className="product-versions__section__title product-versions__section__title--changed">
                          <Image src="/icons/changed-icon.png" alt="" width={16} height={16} />
                          Changed
                        </h3>
                        {renderList(version.changed)}
                      </div>
                    )}

                    {version.learned && version.learned.length > 0 && (
                      <div className="product-versions__section">
                        <h3 className="product-versions__section__title product-versions__section__title--learned">
                          <Image src="/icons/learned-icon.png" alt="" width={16} height={16} />
                          Learned
                        </h3>
                        {renderList(version.learned)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer/Contact Information */}
        <div className="product-versions__footer">
          <SupportSection />
        </div>
      </div>

      <style jsx>{`
        .product-versions {
          width: 100%;
        }

        .product-versions__header {
          margin-bottom: 40px;
        }

        .product-versions__header__title {
          font-size: 16px;
          font-weight: 600;
          line-height: 40px;
          color: #000000;
          text-align: center;
        }

        .product-versions__controls {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 12px;
        }

        .product-versions__controls__expand-all {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
          font-weight: 400;
          cursor: pointer;
          border-radius: 999px;
          transition: all 0.2s;
        }

        .product-versions__controls__expand-all:hover {
          color: #475569;
          background-color: rgba(0, 0, 0, 0.02);
        }

        :global(.product-versions__controls__expand-all__icon) {
          transition: transform 0.2s ease;
        }

        :global(.product-versions__controls__expand-all__icon--expanded) {
          transform: rotate(180deg);
        }

        .product-versions__versions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }

        .product-versions__footer {
          margin-bottom: 100px;
        }

        .product-versions__version-card {
          background: rgba(248, 250, 252, 1);
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 1);
        }

        .product-versions__version-card__button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          padding: 32px;
          cursor: pointer;
          text-align: left;
          transition: color 0.2s ease;
        }

        .product-versions__version-card__header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .product-versions__version-card__version {
          font-size: 16px;
          font-weight: 600;
          line-height: 20px;
          color: #0f172a;
        }

        .product-versions__version-card__date {
          font-size: 13px;
          font-weight: 400;
          line-height: 20px;
          color: #334155;
        }

        .product-versions__chevron {
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .product-versions__chevron--expanded {
          transform: rotate(180deg);
        }

        .product-versions__version-card__content {
          padding: 24px 32px 32px 32px;
          animation: fadeIn 0.3s ease;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .product-versions__section {
          margin-bottom: 0;
        }

        .product-versions__section__title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
          line-height: 20px;
          margin-bottom: 16px;
          color: rgba(22, 22, 31, 1);
        }

        .product-versions__list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        :global(.product-versions__list__item) {
          font-family: inherit;
          font-size: 14px;
          font-weight: 400;
          font-style: normal;
          line-height: 20px;
          letter-spacing: 0;
          color: #475569;
          margin: 0 0 12px 0;
          padding-left: 20px;
          position: relative;
          display: block;
        }

        :global(.product-versions__list__item)::before {
          content: '•';
          position: absolute;
          left: 6px;
          top: 0;
          color: #475569;
        }

        :global(.product-versions__list__item:last-child) {
          margin-bottom: 0;
        }

        .product-versions__list__sub {
          list-style: none;
          padding: 0;
          margin: 8px 0 0 0;
        }

        :global(.product-versions__list__sub__item) {
          font-family: inherit;
          font-size: 14px;
          font-weight: 400;
          font-style: normal;
          line-height: 20px;
          letter-spacing: 0;
          color: #475569;
          margin: 0 0 10px 0;
          padding-left: 18px;
          position: relative;
          display: block;
        }

        :global(.product-versions__list__sub__item)::before {
          content: '•';
          position: absolute;
          left: 4px;
          top: 0;
          color: #475569;
        }

        :global(.product-versions__list__sub__item:last-child) {
          margin-bottom: 0;
        }


        @media (max-width: 1024px) {
          .product-versions__version-card__content {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .product-versions__section {
            margin-bottom: 0;
          }
        }

        @media (min-width: 1024px) {
          .product-versions__header__title {
            font-size: 24px;
            line-height: 48px;
          }

          .product-versions__container {
            padding: 32px;
          }

          .product-versions__container__section__version {
            font-size: 18px;
            line-height: 28px;
          }
        }
      `}</style>
    </>
  );
}

