import React from 'react';
import Link from 'next/link';
import { LinkIcon } from '../icons';
import { TEAMS_ADD_URL } from '../constants';
import s from '../EditInvestorProfileForm.module.scss';

export const FundInfoSection: React.FC = () => {
  return (
    <div className={s.sectionHeader}>
      <h3>Your Investment Fund Profile</h3>
      <p>We use your fund&apos;s profile for check size, stages, and focus.</p>

      <div className={s.infoSectionLabel}>Verify your team profile details</div>
      <div className={s.infoSectionContent}>
        We don&apos;t see a whitelisted fund associated with your account.{' '}
        <Link href={TEAMS_ADD_URL} className={s.ctaLink}>
          Submit a Fund <LinkIcon />
        </Link>
      </div>
    </div>
  );
};
