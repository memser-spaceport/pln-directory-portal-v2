import React from 'react';

import s from './ChatSubheader.module.scss';
import clsx from 'clsx';

interface Props {
  onToggleHistory: () => void;
  isShowHistory: boolean;
  isEmpty: boolean;
  lastQuery: string;
  isLoggedIn: boolean;
}

export const ChatSubheader = ({ isEmpty, isShowHistory, onToggleHistory, lastQuery, isLoggedIn }: Props) => {
  function renderContent() {
    if (isShowHistory) {
      return (
        <>
          <div className={s.left}>
            <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7 0.75C10.8555 0.75 14 3.89453 14 7.75C14 11.6328 10.8555 14.75 7 14.75C5.55078 14.75 4.23828 14.3398 3.11719 13.6016C2.81641 13.4102 2.73438 13 2.92578 12.6992C3.14453 12.3984 3.55469 12.3164 3.85547 12.5078C4.75781 13.1094 5.82422 13.4375 7 13.4375C10.1172 13.4375 12.6875 10.8945 12.6875 7.75C12.6875 4.63281 10.1172 2.0625 7 2.0625C4.97656 2.0625 3.19922 3.12891 2.1875 4.6875H3.71875C4.07422 4.6875 4.375 4.98828 4.375 5.34375C4.375 5.72656 4.07422 6 3.71875 6H0.65625C0.273438 6 0 5.72656 0 5.34375V2.28125C0 1.92578 0.273438 1.625 0.65625 1.625C1.01172 1.625 1.3125 1.92578 1.3125 2.28125V3.67578C2.57031 1.92578 4.64844 0.75 7 0.75ZM7 4.25C7.35547 4.25 7.65625 4.55078 7.65625 4.90625V7.50391L9.40625 9.25391C9.67969 9.52734 9.67969 9.9375 9.40625 10.1836C9.16016 10.457 8.75 10.457 8.50391 10.1836L6.53516 8.21484C6.39844 8.10547 6.34375 7.94141 6.34375 7.75V4.90625C6.34375 4.55078 6.61719 4.25 7 4.25Z"
                fill="#0F172A"
              />
            </svg>
            <span className={s.title}>Your AI Search History</span>
          </div>
          <button onClick={onToggleHistory} className={s.button}>
            Close
          </button>
        </>
      );
    }

    if (isEmpty) {
      return (
        <>
          {/*<div className={s.left}>*/}
          {/*  <span className={s.title}>Explore Teams, Members, Projects & Gatherings happening around the network</span>*/}
          {/*</div>*/}
          {isLoggedIn && (
            <button onClick={onToggleHistory} className={clsx(s.button, s.alignRight)}>
              Your AI Search History{' '}
              <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7 0.75C10.8555 0.75 14 3.89453 14 7.75C14 11.6328 10.8555 14.75 7 14.75C5.55078 14.75 4.23828 14.3398 3.11719 13.6016C2.81641 13.4102 2.73438 13 2.92578 12.6992C3.14453 12.3984 3.55469 12.3164 3.85547 12.5078C4.75781 13.1094 5.82422 13.4375 7 13.4375C10.1172 13.4375 12.6875 10.8945 12.6875 7.75C12.6875 4.63281 10.1172 2.0625 7 2.0625C4.97656 2.0625 3.19922 3.12891 2.1875 4.6875H3.71875C4.07422 4.6875 4.375 4.98828 4.375 5.34375C4.375 5.72656 4.07422 6 3.71875 6H0.65625C0.273438 6 0 5.72656 0 5.34375V2.28125C0 1.92578 0.273438 1.625 0.65625 1.625C1.01172 1.625 1.3125 1.92578 1.3125 2.28125V3.67578C2.57031 1.92578 4.64844 0.75 7 0.75ZM7 4.25C7.35547 4.25 7.65625 4.55078 7.65625 4.90625V7.50391L9.40625 9.25391C9.67969 9.52734 9.67969 9.9375 9.40625 10.1836C9.16016 10.457 8.75 10.457 8.50391 10.1836L6.53516 8.21484C6.39844 8.10547 6.34375 7.94141 6.34375 7.75V4.90625C6.34375 4.55078 6.61719 4.25 7 4.25Z"
                  fill="#156FF7"
                />
              </svg>
            </button>
          )}
        </>
      );
    }
  }

  return <div className={s.root}>{renderContent()}</div>;
};
