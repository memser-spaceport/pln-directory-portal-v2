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
  defaultTeamUid,
  defaultExpanded = true,
  telegramHandle,
  officeHours,
}: AdditionalDetailsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const { watch, setValue } = useFormContext<IrlGatheringFormData>();
  const additionalDetails = watch('additionalDetails') || '';
  const selectedTeam = watch('selectedTeam');

  const charactersLeft = MAX_CHARACTERS - additionalDetails.length;

  // Convert teams to FormSelect options format
  const teamOptions = useMemo(() => {
    return teams.map((team) => ({
      value: team.teamUid,
      label: team.teamTitle,
    }));
  }, [teams]);

  // Preselect the default team on mount
  useEffect(() => {
    if (teams.length > 0 && !selectedTeam) {
      // Try to find the user's default team in the list
      const defaultTeam = defaultTeamUid ? teams.find((t) => t.teamUid === defaultTeamUid) : null;
      // Use the default team if found, otherwise use the first team
      const teamToSelect = defaultTeam || teams[0];
      if (teamToSelect) {
        setValue('selectedTeam', { value: teamToSelect.teamUid, label: teamToSelect.teamTitle });
      }
    }
  }, [teams, defaultTeamUid, selectedTeam, setValue]);

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
            />
          </div>
        </div>
      )}
    </div>
  );
}

