'use client';

/**
 * PLAA-94 disclaimer box. Fixed legal copy, transcribed verbatim from the
 * ticket — no data, so nothing here is sourced.
 */
export default function PlaaDisclaimerBox() {
  return (
    <div className="pdb">
      <i className="ph ph-info" style={{ fontSize: '18px', color: 'var(--text-tertiary)', marginTop: '1px', flex: 'none' }} />
      <p>
        PLAA are a regulated security and are not ownership interests. PLAA are not offered for sale and cannot be
        purchased; they are collected through contribution to the network. Nothing here is an offer, solicitation, or
        investment, legal, or tax advice. Trust holdings and NAV figures shown are illustrative and as of the date
        indicated. Any past performance shown is not indicative of future results, and all holdings involve risk,
        including the potential loss of principal.
      </p>

      <style jsx>{`
        .pdb {
          margin-top: 24px;
          padding: 16px 20px;
          border-radius: var(--radius-xl);
          background: var(--surface-card);
          box-shadow: var(--ring-hairline);
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .pdb p {
          font: var(--text-body-sm);
          color: var(--text-tertiary);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
