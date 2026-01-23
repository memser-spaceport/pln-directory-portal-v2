'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormSelect } from '@/components/form/FormSelect';
import { FormField } from '@/components/form/FormField/FormField';
import {
  DiamondsFourIcon,
  CaretUpIcon,
  CaretDownIcon,
} from '../icons';
import { IrlGatheringFormData } from '../types';
import s from '../IrlGatheringModal.module.scss';

const MAX_CHARACTERS = 150;

// URL validation that accepts links with or without http/https prefix
const isValidUrl = (value: string): boolean | string => {
  if (!value) return true; // Allow empty values

  // Add https:// if no protocol is present for validation
  const urlToValidate = value.match(/^https?:\/\//) ? value : `https://${value}`;

  try {
    const url = new URL(urlToValidate);
    // Check if it has a valid domain structure
    if (!url.hostname.includes('.')) {
      return 'Please enter a valid URL';
    }
    return true;
  } catch {
    return 'Please enter a valid URL';
  }
};

interface TeamFromApi {
  teamUid: string;
  teamTitle: string;
  logo?: string;
}

interface AdditionalDetailsSectionProps {
  teams: TeamFromApi[];
  defaultTeamUid?: string;
  defaultExpanded?: boolean;
  telegramHandle?: string | null;
  officeHours?: string | null;
}

export function AdditionalDetailsSection({
  teams,
  defaultExpanded = true,
  telegramHandle,
  officeHours,
}: AdditionalDetailsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { watch, setValue } = useFormContext<IrlGatheringFormData>();
  const additionalDetails = watch('additionalDetails') || '';

  const charactersLeft = MAX_CHARACTERS - additionalDetails.length;

  // Convert teams to FormSelect options format
  const teamOptions = useMemo(() => {
    return teams.map((team) => ({
      value: team.teamUid,
      label: team.teamTitle,
    }));
  }, [teams]);

  // Prefill telegram handle when member data is loaded
  useEffect(() => {
    if (telegramHandle) {
      // Format telegram handle with @ prefix if not already present
      const formatted = telegramHandle.startsWith('@') ? telegramHandle : `@${telegramHandle}`;
      setValue('telegramHandle', formatted);
    }
  }, [telegramHandle, setValue]);

  // Prefill office hours when member data is loaded
  useEffect(() => {
    if (officeHours) {
      setValue('officeHours', officeHours);
    }
  }, [officeHours, setValue]);

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARACTERS) {
      setValue('additionalDetails', value);
    }
  };

  return (
    <div className={s.additionalDetailsContainer}>
      <button type="button" className={s.additionalDetailsHeader} onClick={toggleExpanded}>
        <div className={s.additionalDetailsHeaderContent}>
          <span className={s.additionalDetailsIcon}>
            <DiamondsFourIcon />
          </span>
          <span className={s.additionalDetailsTitle}>Additional details</span>
        </div>
        <span className={s.additionalDetailsCaret}>
          {isExpanded ? <CaretUpIcon /> : <CaretDownIcon />}
        </span>
      </button>

      {isExpanded && (
        <div className={s.additionalDetailsContent}>
          {/* About / How should people connect */}
          <div className={s.additionalDetailsField}>
            <label className={s.additionalDetailsLabel}>
              How should people connect with you?
            </label>
            <div className={s.additionalDetailsTextareaContainer}>
              <textarea
                className={s.additionalDetailsTextarea}
                placeholder="I can help with product strategy and UX feedback. Looking to connect with early-stage founders."
                value={additionalDetails}
                onChange={handleTextChange}
                rows={3}
              />
            </div>
            <span className={s.additionalDetailsCharCount}>
              {charactersLeft}/{MAX_CHARACTERS} characters left
            </span>
          </div>

          {/* Team Selector */}
          {teams.length > 0 && (
            <div className={s.teamSelectorWrapper}>
              <FormSelect
                name="selectedTeam"
                label="Change team"
                placeholder="Select a team"
                backLabel="Teams"
                options={teamOptions}
              />
            </div>
          )}

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
              rules={{ validate: isValidUrl }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

