'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { FormSelect } from '@/components/form/FormSelect';
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
}

export function AdditionalDetailsSection({
  teams,
  defaultTeamUid,
  defaultExpanded = true,
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
        </div>
      )}
    </div>
  );
}

