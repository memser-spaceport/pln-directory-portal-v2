'use client';

import { useState } from 'react';
import { AddressBookIcon, CaretUpIcon, CaretDownIcon } from '../icons';
import s from '../IrlGatheringModal.module.scss';

interface ContactInfoSectionProps {
  telegramHandle?: string | null;
  officeHours?: string | null;
  defaultExpanded?: boolean;
}

export function ContactInfoSection({
  telegramHandle,
  officeHours,
  defaultExpanded = true,
}: ContactInfoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  // Format telegram handle to show with @ prefix
  const formattedTelegram = telegramHandle
    ? telegramHandle.startsWith('@')
      ? telegramHandle
      : `@${telegramHandle}`
    : '';

  return (
    <div className={s.contactInfoContainer}>
      <button type="button" className={s.contactInfoHeader} onClick={toggleExpanded}>
        <div className={s.contactInfoHeaderContent}>
          <span className={s.contactInfoIcon}>
            <AddressBookIcon />
          </span>
          <span className={s.contactInfoTitle}>Your contact info</span>
        </div>
        <span className={s.contactInfoCaret}>
          {isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
        </span>
      </button>

      {isExpanded && (
        <div className={s.contactInfoContent}>
          {/* Telegram Handle */}
          <div className={s.contactInfoField}>
            <div className={s.contactInfoLabelRow}>
              <span className={s.contactInfoLabel}>Telegram handle</span>
              <span className={s.contactInfoPrefilled}>(Prefilled)</span>
            </div>
            <div className={s.contactInfoInputBox}>
              <span className={s.contactInfoInputValue}>
                {formattedTelegram || 'Not provided'}
              </span>
            </div>
          </div>

          {/* Office Hours */}
          <div className={s.contactInfoField}>
            <div className={s.contactInfoLabelRow}>
              <span className={s.contactInfoLabel}>Office Hours</span>
              <span className={s.contactInfoPrefilled}>(Prefilled)</span>
            </div>
            <div className={s.contactInfoInputBox}>
              <span className={s.contactInfoInputValue}>
                {officeHours || 'Not provided'}
              </span>
            </div>
            <p className={s.contactInfoHelperText}>
              I will be available for a short 1:1 call to connect — no introduction needed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

