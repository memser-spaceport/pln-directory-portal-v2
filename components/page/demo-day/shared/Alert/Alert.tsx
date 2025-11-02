import React from 'react';
import s from './Alert.module.scss';

interface AlertProps {
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({ children }) => {
  return (
    <div className={s.alert}>
      <div className={s.content}>
        <div className={s.text}>{children}</div>
      </div>
      <div className={s.border} aria-hidden="true" />
    </div>
  );
};
