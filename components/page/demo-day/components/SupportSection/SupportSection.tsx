import React from 'react';
import s from './SupportSection.module.scss';

export const SupportSection = () => {
  return (
    <div className={s.container}>
      <div className={s.content}>
        <p className={s.title}>
          Anything not working? <br /> Questions? Feedback?
        </p>
        <p className={s.description}>
          Email us:{' '}
          <a href="mailto:pldemoday@protocol.ai" className={s.link}>
            pldemoday@protocol.ai
          </a>{' '}
          — we aim to get back asap.
        </p>
      </div>
    </div>
  );
};
