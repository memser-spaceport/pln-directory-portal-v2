'use client';

import React from 'react';
import clsx from 'clsx';
import {
  DetailsSection,
  DetailsSectionHeader,
  DetailsSectionGreyContentContainer,
} from '@/components/common/profile/DetailsSection';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { UsersThreeIcon } from '@/components/icons/UsersThreeIcon';
import { CalendarBlankIcon } from '@/components/icons/CalendarBlankIcon';
import { SpinnerIcon } from '@/components/icons/SpinnerIcon';
import { useAffinityAccess } from '@/services/access-control/hooks/useAffinityAccess';
import { useAffinityMember } from '@/services/affinity/hooks/useAffinityMember';
import { useRetriggerAffinityEnrichment } from '@/services/affinity/hooks/useRetriggerAffinityEnrichment';
import { useAffinityAnalytics } from '@/analytics/affinity.analytics';
import s from './RelationshipDetails.module.scss';

interface Props {
  memberUid: string;
}

// Local copy using currentColor — the shared ChartIcon has a hardcoded fill.
const ChartIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12.9062 11.375C12.9062 11.549 12.8371 11.716 12.714 11.839C12.591 11.9621 12.424 12.0312 12.25 12.0312H1.75C1.57595 12.0312 1.40903 11.9621 1.28596 11.839C1.16289 11.716 1.09375 11.549 1.09375 11.375V2.625C1.09375 2.45095 1.16289 2.28403 1.28596 2.16096C1.40903 2.03789 1.57595 1.96875 1.75 1.96875C1.92405 1.96875 2.09097 2.03789 2.21404 2.16096C2.33711 2.28403 2.40625 2.45095 2.40625 2.625V8.03906L4.7857 5.65906C4.84667 5.59788 4.91912 5.54934 4.99888 5.51622C5.07865 5.4831 5.16418 5.46605 5.25055 5.46605C5.33692 5.46605 5.42244 5.4831 5.50221 5.51622C5.58198 5.54934 5.65442 5.59788 5.71539 5.65906L7 6.94531L9.35156 4.59375H8.75C8.57595 4.59375 8.40903 4.52461 8.28596 4.40154C8.16289 4.27847 8.09375 4.11155 8.09375 3.9375C8.09375 3.76345 8.16289 3.59653 8.28596 3.47346C8.40903 3.35039 8.57595 3.28125 8.75 3.28125H10.9375C11.1115 3.28125 11.2785 3.35039 11.4015 3.47346C11.5246 3.59653 11.5938 3.76345 11.5938 3.9375V6.125C11.5937 6.29905 11.5246 6.46597 11.4015 6.58904C11.2785 6.71211 11.1115 6.78125 10.9375 6.78125C10.7635 6.78125 10.5965 6.71211 10.4735 6.58904C10.3504 6.46597 10.2813 6.29905 10.2812 6.125V5.52344L7.4643 8.34094C7.40333 8.40212 7.33088 8.45066 7.25112 8.48378C7.17135 8.51691 7.08582 8.53396 6.99945 8.53396C6.91308 8.53396 6.82756 8.51691 6.74779 8.48378C6.66802 8.45066 6.59558 8.40212 6.53461 8.34094L5.25 7.05469L2.40625 9.89844V10.7188H12.25C12.424 10.7188 12.591 10.7879 12.714 10.911C12.8371 11.034 12.9062 11.201 12.9062 11.375Z"
      fill="currentColor"
    />
  </svg>
);

const TIER_BADGE: Record<'high' | 'neglected', { label: string; variant: 'success' | 'error' }> = {
  high: { label: 'High touch', variant: 'success' },
  neglected: { label: 'Neglected', variant: 'error' },
};

function formatContactDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

export function RelationshipDetails({ memberUid }: Props) {
  const { hasAccess } = useAffinityAccess();
  const { data, isLoading } = useAffinityMember(memberUid, hasAccess);
  const { mutate: retrigger, isPending: isRetriggering } = useRetriggerAffinityEnrichment(memberUid);
  const { onRelationshipRefreshClicked } = useAffinityAnalytics();

  if (!hasAccess || isLoading || !data || data.relationship.empty) return null;

  const { owner, last_contact, frequency_tier, touchpoints_6m, window_months } = data.relationship;

  return (
    <DetailsSection classes={{ root: s.root }}>
      <DetailsSectionHeader title="Relationship" />

      <div className={s.blocks}>
        {owner && (
          <DetailsSectionGreyContentContainer className={clsx(s.block, s.blockWithIcon)}>
            <span className={s.circleIcon}>
              <UsersThreeIcon />
            </span>
            <div className={s.blockBody}>
              <span className={s.blockLabel}>Relationship owner</span>
              <span className={s.ownerName}>{owner.name}</span>
            </div>
          </DetailsSectionGreyContentContainer>
        )}

        {last_contact && (
          <DetailsSectionGreyContentContainer className={clsx(s.block, s.blockWithIcon)}>
            <span className={s.circleIcon}>
              <CalendarBlankIcon />
            </span>
            <div className={s.blockBody}>
              <span className={s.blockLabel}>Last contact</span>
              <div className={s.contactBody}>
                <span className={s.contactWhenPrimary}>{formatContactDate(last_contact.date)}</span>
                {last_contact.summary && (
                  <span className={s.contactSummary}>{truncate(last_contact.summary, 120)}</span>
                )}
              </div>
            </div>
          </DetailsSectionGreyContentContainer>
        )}

        <DetailsSectionGreyContentContainer className={clsx(s.block, s.blockWithIcon)}>
          <span className={s.circleIcon}>
            <ChartIcon />
          </span>
          <div className={clsx(s.blockBody, s.blockBodyLoose)}>
            <span className={s.blockLabel}>Interaction frequency</span>
            <div className={s.freqHeader}>
              {frequency_tier && (
                <Badge variant={TIER_BADGE[frequency_tier].variant}>{TIER_BADGE[frequency_tier].label}</Badge>
              )}
              <span className={s.freqCount}>
                <strong>{touchpoints_6m}</strong> {touchpoints_6m === 1 ? 'touchpoint' : 'touchpoints'} in the last{' '}
                {window_months} months
              </span>
            </div>
          </div>
        </DetailsSectionGreyContentContainer>
      </div>

      <div className={s.footer}>
        <Button
          type="button"
          size="xs"
          variant="secondary"
          style="border"
          className={s.updateButton}
          onClick={() => {
            onRelationshipRefreshClicked({
              memberUid,
              frequencyTier: frequency_tier,
              touchpoints6m: touchpoints_6m,
            });
            retrigger();
          }}
          disabled={isRetriggering}
          aria-label="Update relationship data"
        >
          {isRetriggering ? (
            <span className={s.updateButtonContent}>
              <SpinnerIcon className={s.updateButtonSpinner} />
              Refreshing…
            </span>
          ) : (
            'Refresh data'
          )}
        </Button>
      </div>
    </DetailsSection>
  );
}
