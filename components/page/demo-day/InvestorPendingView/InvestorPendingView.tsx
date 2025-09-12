import React from 'react';
import s from './InvestorPendingView.module.scss';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const PrimaryButton = ({ children, onClick, className }: ButtonProps) => {
  return (
    <button className={`${s.primaryButton} ${className || ''}`} onClick={onClick}>
      {children}
    </button>
  );
};

export const InvestorPendingView = () => {
  const handleFillProfile = () => {
    // TODO: Navigate to investor profile form
    console.log('Navigate to investor profile form');
  };

  return (
    <div className={s.eventHeader}>
      {/* Background decorative elements */}
      <div className={s.backgroundAccents}>
        <div className={s.accentsImage} />
      </div>
      <div className={s.backgroundVector}>
        <div className={s.vectorImage} />
      </div>

      {/* Main content */}
      <div className={s.content}>
        {/* Date and time section */}
        <div className={s.dateSection}>
          <div className={s.dateContainer}>
            <span className={s.dateLabel}>Date:</span>
            <span className={s.timeValue}>19:00</span>
            <div className={s.divider} />
            <span className={s.dateValue}>25</span>
            <div className={s.divider} />
            <span className={s.dateValue}>Oct</span>
            <div className={s.divider} />
            <span className={s.dateValue}>2025</span>
          </div>
        </div>

        {/* Headline section */}
        <div className={s.headline}>
          <h1 className={s.title}>PL Demo Day</h1>
          <p className={s.description}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        {/* Call to action section */}
        <div className={s.ctaSection}>
          <p className={s.ctaText}>
            Complete your investor profile to join Demo Day
          </p>
          <PrimaryButton onClick={handleFillProfile} className={s.ctaButton}>
            Fill in Your Investor Profile
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};
