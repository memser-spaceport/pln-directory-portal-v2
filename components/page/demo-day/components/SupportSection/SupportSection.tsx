import React from 'react';
import s from './SupportSection.module.scss';

type SupportSectionProps = {
  supportEmail?: string;
  onContactClick?: () => void;
};

export const SupportSection = ({ supportEmail = 'pldemoday@protocol.ai', onContactClick }: SupportSectionProps) => {
  return (
    <div className={s.container}>
      <div className={s.content}>
        <p className={s.title}>Questions or feedback?</p>
        <p className={s.description}>
          Reach out:{' '}
          {onContactClick ? (
            <button type="button" onClick={onContactClick} className={s.linkButton}>
              {supportEmail}
            </button>
          ) : (
            <a href={`mailto:${supportEmail}`} className={s.link}>
              {supportEmail}
            </a>
          )}{' '}
          (Typical response time: 1hr during EST business hrs)
        </p>
      </div>
    </div>
  );
};
