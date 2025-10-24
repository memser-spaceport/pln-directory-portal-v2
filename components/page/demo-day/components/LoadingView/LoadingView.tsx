import React from 'react';

import s from './LoadingView.module.scss';

export function LoadingView() {
  return (
    <div className={s.root}>
      <div className={s.container}>
        <div className={s.content}>
          <div className={s.spinner}>
            <svg className={s.spinnerSvg} viewBox="0 0 50 50">
              <circle className={s.spinnerCircle} cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
            </svg>
          </div>
          <h3 className={s.title}>Verifying your access...</h3>
        </div>
      </div>
    </div>
  );
}
