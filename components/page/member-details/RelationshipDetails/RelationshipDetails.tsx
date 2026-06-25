'use client';

import React from 'react';
import clsx from 'clsx';
import { DetailsSection } from '@/components/common/profile/DetailsSection';
import { DetailsSectionHeader } from '@/components/common/profile/DetailsSection/components/DetailsSectionHeader';
import { UsersThreeIcon } from '@/components/icons/UsersThreeIcon';
import { CalendarIcon } from '@/components/icons/CalendarIcon';
import { ChartIcon } from '@/components/icons/ChartIcon';
import { useAffinityAccess } from '@/services/access-control/hooks/useAffinityAccess';
import { useAffinityMember } from '@/services/affinity/hooks/useAffinityMember';
import s from './RelationshipDetails.module.scss';

interface Props {
  memberUid: string;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)}…`;
}

function formatContactDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function RelationshipDetails({ memberUid }: Props) {
  const { hasAccess } = useAffinityAccess();
  const { data, isLoading } = useAffinityMember(memberUid, hasAccess);

  if (!hasAccess || isLoading || !data || data.relationship.empty) return null;

  const { owner, last_contact, frequency_tier, touchpoints_6m } = data.relationship;

  return (
    <DetailsSection>
      <DetailsSectionHeader title="Relationship" className={s.header} />
      <div className={s.rows}>
        {owner && (
          <div className={s.row}>
            <div className={s.iconWrap}>
              <UsersThreeIcon />
            </div>
            <div className={s.rowContent}>
              <span className={s.label}>RELATIONSHIP OWNER</span>
              <span className={s.value}>{owner.name}</span>
            </div>
          </div>
        )}

        {last_contact && (
          <div className={s.row}>
            <div className={s.iconWrap}>
              <CalendarIcon />
            </div>
            <div className={s.rowContent}>
              <span className={s.label}>LAST CONTACT</span>
              <span className={s.value}>{formatContactDate(last_contact.date)}</span>
              {last_contact.summary && <p className={s.summary}>{truncate(last_contact.summary, 120)}</p>}
            </div>
          </div>
        )}

        <div className={s.row}>
          <div className={s.iconWrap}>
            <ChartIcon />
          </div>
          <div className={s.rowContent}>
            <span className={s.label}>INTERACTION FREQUENCY</span>
            {frequency_tier && (
              <span className={clsx(s.badge, frequency_tier === 'high' ? s.badgeHigh : s.badgeNeglected)}>
                {frequency_tier === 'high' ? 'High touch' : 'Neglected'}
              </span>
            )}
            <span className={s.touchpoints}>
              {touchpoints_6m} touchpoint{touchpoints_6m !== 1 ? 's' : ''} in the last 6 months
            </span>
          </div>
        </div>
      </div>
    </DetailsSection>
  );
}
