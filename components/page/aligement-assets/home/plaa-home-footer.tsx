'use client';

import Link from 'next/link';

const PROGRAM_LINKS = [
  { label: 'Activities', href: '/alignment-asset/activities' },
  { label: 'Portfolio & Holdings', href: '/alignment-asset/trust-holdings' },
  { label: 'FAQ', href: '/alignment-asset/faqs' },
];

const LEGAL_LINKS = [
  { label: 'Terms of Use', href: '/alignment-asset/terms-of-use' },
  { label: 'Privacy Policy', href: '/alignment-asset/privacy-policy' },
  { label: 'Disclosure', href: '/alignment-asset/disclosure' },
];

/**
 * Home page footer — PLAA-94. Copy is fixed editorial from the prototype and
 * carries no data, so it is transcribed verbatim. The year in the © line is the
 * current year rather than the prototype's literal, so it cannot go stale.
 */
export default function PlaaHomeFooter() {
  return (
    <footer className="pf">
      <div className="pf__top">
        <div className="pf__brand">
          <span className="pf__mark">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 27.612 27.397" fill="none" aria-hidden="true">
              <path
                d="M 13.015 20.455 L 7.573 17.301 C 7.425 17.195 7.235 17.301 7.235 17.493 L 7.235 23.8 C 7.235 23.97 7.32 24.119 7.467 24.205 L 12.909 27.358 C 13.057 27.443 13.247 27.337 13.247 27.166 L 13.247 20.859 C 13.247 20.689 13.162 20.54 13.015 20.455 Z M 13.268 12.465 L 13.247 18.857 C 13.247 19.006 13.099 19.048 12.994 19.006 L 6.349 15.171 C 6.202 15.085 6.012 15.192 6.012 15.362 L 6.012 22.926 C 6.012 23.097 5.801 23.225 5.674 23.118 L 0.232 20.007 C 0.084 19.922 0 19.773 0 19.602 L 0 4.922 C 0 4.751 0.211 4.624 0.338 4.73 L 13.015 12.017 C 13.162 12.145 13.268 12.294 13.268 12.465 Z M 27.274 4.858 L 21.895 7.947 C 21.748 8.033 21.663 8.182 21.642 8.352 L 21.663 16.172 C 21.663 16.342 21.579 16.492 21.431 16.577 L 14.702 20.476 C 14.555 20.561 14.47 20.71 14.47 20.881 L 14.47 27.166 C 14.47 27.337 14.66 27.465 14.808 27.358 L 27.38 20.114 C 27.527 20.029 27.612 19.879 27.612 19.709 L 27.612 5.071 C 27.612 4.879 27.422 4.773 27.274 4.858 Z M 14.47 12.486 L 14.47 18.771 C 14.47 18.942 14.66 19.07 14.808 18.963 L 20.313 15.788 C 20.377 15.767 20.419 15.682 20.419 15.597 L 20.419 9.205 C 20.419 9.034 20.229 8.906 20.081 9.013 L 14.702 12.102 C 14.555 12.166 14.47 12.315 14.47 12.486 Z M 1.034 3.175 L 6.391 0.064 C 6.539 0 6.708 0 6.877 0.064 L 19.554 7.351 C 19.702 7.436 19.702 7.67 19.554 7.756 L 14.175 10.867 C 14.027 10.952 13.859 10.952 13.711 10.867 L 1.034 3.58 C 0.907 3.494 0.907 3.26 1.034 3.175 Z M 15.42 3.175 L 20.841 0.064 C 20.988 -0.021 21.157 -0.021 21.305 0.064 L 26.768 3.217 C 26.916 3.303 26.916 3.537 26.768 3.622 L 21.347 6.733 C 21.199 6.818 21.03 6.818 20.883 6.733 L 15.42 3.58 C 15.272 3.494 15.272 3.26 15.42 3.175 Z"
                fill="currentColor"
                fillRule="nonzero"
              />
            </svg>
          </span>
          <span className="pf__brand-name">Protocol Labs</span>
          <p className="pf__tagline">
            The Alignment Asset recognizes members for contributions that strengthen the Protocol Labs Network.
          </p>
        </div>

        <div className="pf__cols">
          <div className="pf__col">
            <span className="pf__col-head">Program</span>
            {PROGRAM_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="pf__link">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="pf__col">
            <span className="pf__col-head">Legal</span>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="pf__link">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="pf__legal">
        &copy; {new Date().getFullYear()} Protocol Labs. PLAA are a regulated security and not ownership interests.
        Nothing herein is an offer, solicitation, or financial advice.
      </div>

      <style jsx>{`
        .pf {
          border-top: 1px solid var(--border-subtle);
          background: var(--surface-card);
          padding: 32px 0 8px;
          margin-top: 48px;
        }
        .pf__top {
          display: flex;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }
        .pf__brand {
          max-width: 300px;
        }
        .pf__mark {
          width: 24px;
          height: 24px;
          display: inline-flex;
          color: var(--pl-blue-600);
          vertical-align: middle;
        }
        .pf__brand-name {
          font: var(--text-label-lg);
          font-weight: 600;
          color: var(--text-primary);
          margin-left: 8px;
          vertical-align: middle;
        }
        .pf__tagline {
          font: var(--text-body-sm);
          color: var(--text-tertiary);
          margin-top: 10px;
        }
        .pf__cols {
          display: flex;
          gap: 56px;
        }
        .pf__col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pf__col-head {
          font: var(--text-label-md);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .pf__link {
          font: var(--text-body-md);
          color: var(--text-secondary);
          text-decoration: none;
        }
        .pf__link:hover {
          color: var(--color-brand-text);
        }
        .pf__legal {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid var(--border-faint);
          font: var(--text-body-sm);
          color: var(--text-tertiary);
        }
        @media (max-width: 768px) {
          .pf__cols {
            gap: 32px;
          }
        }
      `}</style>
    </footer>
  );
}
