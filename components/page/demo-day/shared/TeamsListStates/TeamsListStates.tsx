import React from 'react';
import s from './TeamsListStates.module.scss';

interface TeamsListLoadingProps {
  title?: string;
}

export const TeamsListLoading: React.FC<TeamsListLoadingProps> = ({ title = 'Teams List' }) => {
  return (
    <div className={s.container}>
      <div className={s.content}>
        <div className={s.spinner}>
          <svg className={s.spinnerSvg} viewBox="0 0 50 50">
            <circle className={s.spinnerCircle} cx="25" cy="25" r="20" fill="none" strokeWidth="4" />
          </svg>
        </div>
        <h3 className={s.title}>Loading teams...</h3>
        <p className={s.description}>Please wait while we fetch the latest team information.</p>
      </div>
    </div>
  );
};

interface TeamsListErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const TeamsListError: React.FC<TeamsListErrorProps> = ({
  title = 'Teams List',
  message = 'Failed to load teams. Please try again.',
  onRetry,
}) => {
  return (
    <div className={s.container}>
      <div className={s.content}>
        <div className={s.errorIcon}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="28" fill="#FEF2F2" />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56ZM32 28C33.1046 28 34 28.8954 34 30V38C34 39.1046 33.1046 40 32 40C30.8954 40 30 39.1046 30 38V30C30 28.8954 30.8954 28 32 28ZM32 22C30.8954 22 30 22.8954 30 24C30 25.1046 30.8954 26 32 26C33.1046 26 34 25.1046 34 24C34 22.8954 33.1046 22 32 22Z"
              fill="#DC2626"
            />
          </svg>
        </div>
        <h3 className={s.title}>Oops! Something went wrong</h3>
        <p className={s.description}>{message}</p>
        {onRetry && (
          <button className={s.retryButton} onClick={onRetry}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.65 2.35C12.2 0.9 10.21 0 8 0C3.58 0 0.01 3.58 0.01 8C0.01 12.42 3.58 16 8 16C11.73 16 14.84 13.45 15.73 10H13.65C12.83 12.33 10.61 14 8 14C4.69 14 2 11.31 2 8C2 4.69 4.69 2 8 2C9.66 2 11.14 2.69 12.22 3.78L9 7H16V0L13.65 2.35Z"
                fill="currentColor"
              />
            </svg>
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
};
