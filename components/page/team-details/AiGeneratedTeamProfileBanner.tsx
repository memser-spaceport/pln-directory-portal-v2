'use client';

import React, { useState } from 'react';

import { InfoCircleIcon } from '@/components/icons';
import { useReviewTeamEnrichmentMutation } from '@/services/teams/hooks/useReviewTeamEnrichmentMutation';
import { ITeam } from '@/types/teams.types';

import s from './AiGeneratedTeamProfileBanner.module.scss';

interface Props {
  team: ITeam;
}

const MESSAGE =
  "We've auto-filled parts of your profile using publicly available information from your website and team name to save you time. Please review key details.";

const REVIEWED_STATUS = 'Reviewed';

export function AiGeneratedTeamProfileBanner({ team }: Props) {
  const [isReviewedOptimistically, setIsReviewedOptimistically] = useState(false);
  const { mutate } = useReviewTeamEnrichmentMutation();

  const isReviewed = isReviewedOptimistically || team?.dataEnrichment?.status === REVIEWED_STATUS;

  if (isReviewed) {
    return null;
  }

  const handleReview = () => {
    setIsReviewedOptimistically(true);

    mutate(
      { teamUid: team.id },
      {
        onError: () => {
          setIsReviewedOptimistically(false);
        },
      },
    );
  };

  return (
    <div className={s.root} data-testid="ai-generated-team-profile-banner">
      <InfoCircleIcon className={s.icon} aria-hidden="true" />
      <p className={s.message}>{MESSAGE}</p>
      <button className={s.action} type="button" onClick={handleReview}>
        I have reviewed the profile
      </button>
    </div>
  );
}