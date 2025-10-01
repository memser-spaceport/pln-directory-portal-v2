import React from 'react';
import s from './ErrorState.module.scss';

interface ErrorStateProps {
  message?: string;
}

export const ErrorState = ({ message = 'Failed to load profile data. Please try again.' }: ErrorStateProps) => {
  return (
    <div className={s.profileCard}>
      <div className={s.errorState}>
        <p>{message}</p>
      </div>
    </div>
  );
};
