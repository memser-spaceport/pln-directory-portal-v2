import React from 'react';
import Lottie from 'lottie-react';

import loader from './loader.json';

import s from './ContentLoader.module.scss';

export const ContentLoader = () => {
  return (
    <div className={s.root}>
      <Lottie animationData={loader} style={{ width: 150, height: 150 }} />
    </div>
  );
};
