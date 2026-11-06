import React from 'react';
import { PRIVACY_POLICY_URL, TERMS_AND_CONDITIONS_URL } from '@/app/constants/demoday';
import s from './SpvFooter.module.scss';

type Props = {
  /** For the default disclaimer; unused when `note` replaces it. */
  supportEmail?: string;
  /** Replaces the default disclaimer and its email (the Explore landing words its own; locked pages show none). */
  note?: React.ReactNode;
  onSupportEmailClicked?: () => void;
  /** Explore PL Network hides the legal links. Spotlight pages keep them. */
  showLegalLinks?: boolean;
};

/** The completed Demo Day's footer: the disclaimer, then the legal links. */
export const SpvFooter = ({ supportEmail, note, onSupportEmailClicked, showLegalLinks = true }: Props) => (
  <footer className={s.root}>
    <p className={s.note}>
      {note ?? (
        <>
          © {new Date().getFullYear()} Protocol Labs. This is a webpage for PLC Neurotech SPV - Netholabs I LLC, managed by
          PLC Neurotech MGMT LP. The SPV relies on Rule 506(c) and anticipates investing in Netholabs Ltd. SPV interests
          are unregistered, illiquid securities with a high degree of risk offered only to verified accredited investors
          and only through the SPV&apos;s offering documents, which govern over this page. There is no guarantee the SPV
          will complete its anticipated investment or that any investment will perform.
          <span className={s.paragraph}>
            Information about the featured team is provided by its founders. Protocol Labs does not endorse or recommend
            any investment, may hold an interest in the featured company, and is not a broker, dealer, or advisor.
            Questions? Write to{' '}
            <a href={`mailto:${supportEmail}`} className={s.mail} onClick={onSupportEmailClicked}>
              {supportEmail}
            </a>
            .
          </span>
        </>
      )}
    </p>
    {showLegalLinks ? (
      <div className={s.links}>
        <a className={s.link} href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
        <a className={s.link} href={TERMS_AND_CONDITIONS_URL} target="_blank" rel="noopener noreferrer">
          Terms & Conditions
        </a>
      </div>
    ) : null}
  </footer>
);
