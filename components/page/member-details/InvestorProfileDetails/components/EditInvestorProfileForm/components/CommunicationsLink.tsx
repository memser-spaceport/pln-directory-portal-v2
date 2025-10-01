import React from 'react';
import Link from 'next/link';
import { InfoIcon, LinkIcon } from '../icons';
import { EMAIL_SETTINGS_URL } from '../constants';
import s from '../EditInvestorProfileForm.module.scss';

export const CommunicationsLink: React.FC = () => {
  return (
    <>
      <div className={s.divider} />
      
      <Link href={EMAIL_SETTINGS_URL} className={s.cta}>
        <div className={s.ctaIcon}>
          <InfoIcon />
        </div>
        <div className={s.col}>
          <div className={s.ctaLink}>
            Manage your investor communications <LinkIcon />
          </div>
          <p>Choose if you&apos;d like to receive event invitations, dealflow intros, and digests.</p>
        </div>
      </Link>
    </>
  );
};
