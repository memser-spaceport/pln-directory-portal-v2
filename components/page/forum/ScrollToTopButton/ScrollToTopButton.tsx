'use client';

import clsx from 'clsx';
import React from 'react';

import { useScrollDirection } from '@/components/core/MobileBottomNav';

import s from './ScrollToTopButton.module.scss';

export const ScrollToTopButton = () => {
  const scrollDirection = useScrollDirection();
  const scrollToTop = () => {
    const scrollableElement = document.querySelector('body');

    scrollableElement?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      className={clsx(s.root, {
        [s.visible]: scrollDirection === 'down',
      })}
      onClick={scrollToTop}
    >
      <ArrowUpIcon />
    </button>
  );
};

const ArrowUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16.9137 13.1634C16.8266 13.2508 16.7231 13.3202 16.6092 13.3675C16.4952 13.4148 16.3731 13.4392 16.2497 13.4392C16.1263 13.4392 16.0041 13.4148 15.8902 13.3675C15.7762 13.3202 15.6727 13.2508 15.5856 13.1634L10.0005 7.57828L4.41374 13.1634C4.23762 13.3396 3.99874 13.4385 3.74967 13.4385C3.5006 13.4385 3.26173 13.3396 3.08561 13.1634C2.90949 12.9873 2.81055 12.7484 2.81055 12.4994C2.81055 12.2503 2.90949 12.0114 3.08561 11.8353L9.33561 5.58531C9.42271 5.49791 9.5262 5.42856 9.64016 5.38124C9.75411 5.33393 9.87628 5.30957 9.99967 5.30957C10.1231 5.30957 10.2452 5.33393 10.3592 5.38124C10.4731 5.42856 10.5766 5.49791 10.6637 5.58531L16.9137 11.8353C17.0011 11.9224 17.0705 12.0259 17.1178 12.1399C17.1651 12.2538 17.1895 12.376 17.1895 12.4994C17.1895 12.6228 17.1651 12.7449 17.1178 12.8589C17.0705 12.9728 17.0011 13.0763 16.9137 13.1634Z"
      fill="#1B4DFF"
    />
  </svg>
);
