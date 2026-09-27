'use client';

interface PlaaProspectBannerProps {
  readonly portfolioCompanies?: number;
  readonly onGetStarted: () => void;
}

export default function PlaaProspectBanner({ portfolioCompanies, onGetStarted }: PlaaProspectBannerProps) {
  return (
    <div className="ppb">
      <span className="ppb__label">
        <i className="ph-fill ph-sparkle" style={{ fontSize: '16px', color: 'var(--pl-blue-300)' }} />
        New to PLAA?
      </span>
      <span className="ppb__copy">
        Learn more about how PLAA powers the network and provides exposure to{' '}
        {portfolioCompanies ? `${portfolioCompanies.toLocaleString('en-US')} ` : ''}startups and crypto tokens.
      </span>
      <button type="button" className="ppb__cta" onClick={onGetStarted}>
        Get started
        <i className="ph-bold ph-arrow-right" style={{ fontSize: '14px' }} />
      </button>

      <style jsx>{`
        .ppb {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 11px 24px;
          background: var(--pl-slate-900);
          color: #fff;
          flex-wrap: wrap;
          margin: calc(clamp(20px, 2.4vw, 36px) * -1) calc(var(--plaa-home-gutter) * -1) 32px;
        }
        .ppb__label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font: var(--text-label-lg);
          font-weight: 600;
          white-space: nowrap;
        }
        .ppb__copy {
          font: var(--text-body-md);
          color: rgba(255, 255, 255, 0.72);
        }
        .ppb__cta {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 32px;
          padding: 0 14px;
          border: none;
          background: #fff;
          color: var(--pl-slate-900);
          border-radius: var(--radius-md);
          font: var(--text-label-lg);
          font-weight: 600;
          cursor: pointer;
          flex: none;
        }
        @media (max-width: 768px) {
          .ppb {
            margin: -20px -16px 24px;
            padding: 11px 16px;
          }
          .ppb__cta {
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
