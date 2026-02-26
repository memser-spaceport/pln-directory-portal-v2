'use client';

import s from './InfoBanner.module.scss';

const InfoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M12 16V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function InfoBanner() {
  return (
    <div className={s.alert}>
      <div className={s.container}>
        <div className={s.icon}>
          <InfoIcon />
        </div>
        <div className={s.content}>
          <h3 className={s.title}>IRL Gatherings Details Access Restricted</h3>
          <div className={s.description}>
            <p>Your current access level doesn&apos;t include</p>
            <p>IRL Gatherings details privileges.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
