import React from 'react';
import { PRIVACY_POLICY_URL, TERMS_AND_CONDITIONS_URL } from '@/app/constants/demoday';
import s from './SpvFooter.module.scss';

type Props = {
  supportEmail: string;
};

/** The completed Demo Day's footer: the disclaimer, then the legal links. */
export const SpvFooter = ({ supportEmail }: Props) => (
  <footer className={s.root}>
    <p className={s.note}>
      © {new Date().getFullYear()} Protocol Labs. All content is provided by the founders. Protocol Labs does not
      endorse or recommend any investment, and is not a broker, dealer, or advisor. Questions? Write to{' '}
      <a href={`mailto:${supportEmail}`} className={s.mail}>
        {supportEmail}
      </a>
      .
    </p>
    <div className={s.links}>
      <a className={s.link} href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer">
        Privacy Policy
      </a>
      <a className={s.link} href={TERMS_AND_CONDITIONS_URL} target="_blank" rel="noopener noreferrer">
        Terms & Conditions
      </a>
    </div>
  </footer>
);
