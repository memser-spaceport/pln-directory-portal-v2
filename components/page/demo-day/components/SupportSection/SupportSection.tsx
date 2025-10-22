import React from 'react';
import s from './SupportSection.module.scss';

export const SupportSection = () => {
  return (
    <div className={s.container}>
      <div className={s.content}>
        <p className={s.title}>Questions or feedback?</p>
        <p className={s.description}>
          Reach out:{' '}
          <a href="mailto:pldemoday@protocol.ai" className={s.link}>
            pldemoday@protocol.ai
          </a>
          <br />
          (Typical response time: within 24 hrs)
        </p>
      </div>
    </div>
  );
};
