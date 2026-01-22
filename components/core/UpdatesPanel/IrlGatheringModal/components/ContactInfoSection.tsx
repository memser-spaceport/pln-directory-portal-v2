'use client';

import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormField } from '@/components/form/FormField/FormField';
import { AddressBookIcon, CaretUpIcon, CaretDownIcon } from '../icons';
import { IrlGatheringFormData } from '../types';
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
  const { setValue } = useFormContext<IrlGatheringFormData>();

  // Prefill form values when member data is loaded
  useEffect(() => {
    if (telegramHandle) {
      // Format telegram handle with @ prefix if not already present
      const formatted = telegramHandle.startsWith('@') ? telegramHandle : `@${telegramHandle}`;
      setValue('telegramHandle', formatted);
    }
  }, [telegramHandle, setValue]);

  useEffect(() => {
    if (officeHours) {
      setValue('officeHours', officeHours);
    }
  }, [officeHours, setValue]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

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
          <div className={s.contactInfoFieldWrapper}>
            <div className={s.contactInfoLabelRow}>
              <span className={s.contactInfoLabel}>Telegram handle</span>
              <span className={s.contactInfoPrefilled}>(Prefilled)</span>
            </div>
            <FormField name="telegramHandle" placeholder="@username" />
          </div>

          {/* Office Hours */}
          <div className={s.contactInfoFieldWrapper}>
            <div className={s.contactInfoLabelRow}>
              <span className={s.contactInfoLabel}>Office Hours</span>
              <span className={s.contactInfoPrefilled}>(Prefilled)</span>
            </div>
            <FormField
              name="officeHours"
              placeholder="https://calendly.com/your-link"
              description="I will be available for a short 1:1 call to connect — no introduction needed."
            />
          </div>
        </div>
      )}
    </div>
  );
}

