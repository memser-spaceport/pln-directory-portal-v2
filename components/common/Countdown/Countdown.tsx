import React from 'react';
import Countdown from 'react-countdown';
import s from './Countdown.module.scss';

interface CountdownComponentProps {
  targetDate: string | Date;
  title?: string;
}

interface CountdownRendererProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  completed: boolean;
}

const CountdownRenderer: React.FC<CountdownRendererProps> = ({ days, hours, minutes, seconds, completed }) => {
  if (completed) {
    return (
      <div className={s.root}>
        <div className={s.title}>Demo Day is now live!</div>
      </div>
    );
  }

  // Format numbers to always show 2 digits
  const formatTime = (time: number) => String(time).padStart(2, '0');

  return (
    <div className={s.root}>
      <div className={s.title}>Demo Day unlocks in:</div>
      <div className={s.timeContainer}>
        <div className={s.timeUnit}>
          <div className={s.timeValue}>{formatTime(days)}</div>
          <div className={s.timeLabel}>Days</div>
        </div>
        <div className={s.divider} />
        <div className={s.timeUnit}>
          <div className={s.timeValue}>{formatTime(hours)}</div>
          <div className={s.timeLabel}>Hours</div>
        </div>
        <div className={s.divider} />
        <div className={s.timeUnit}>
          <div className={s.timeValue}>{formatTime(minutes)}</div>
          <div className={s.timeLabel}>Min</div>
        </div>
        <div className={s.divider} />
        <div className={s.timeUnit}>
          <div className={s.timeValue}>{formatTime(seconds)}</div>
          <div className={s.timeLabel}>Sec</div>
        </div>
      </div>
    </div>
  );
};

export const CountdownComponent: React.FC<CountdownComponentProps> = ({ targetDate, title }) => {
  return <Countdown date={targetDate} renderer={(props) => <CountdownRenderer {...props} />} />;
};
