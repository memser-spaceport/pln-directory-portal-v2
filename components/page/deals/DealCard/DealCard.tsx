'use client';

import Link from 'next/link';
import { IDeal } from '@/types/deals.types';
import { DEAL_CATEGORY_LABELS, DEAL_AUDIENCE_LABELS } from '@/services/deals/constants';
import { DEAL_ICONS } from '../dealsIcons';
import s from './DealCard.module.scss';

interface DealCardProps {
  deal: IDeal;
}

export function DealCard({ deal }: DealCardProps) {
  const IconComponent = DEAL_ICONS[deal.vendorName.toLowerCase()];

  return (
    <Link href={`/deals/${deal.uid}`} className={s.card}>
      <div className={s.content}>
        <div className={s.avatar}>
          {IconComponent ? <IconComponent /> : <div className={s.avatarPlaceholder}>{deal.vendorName.charAt(0)}</div>}
        </div>
        <div className={s.details}>
          <div className={s.description}>
            <h3 className={s.title}>{deal.vendorName}</h3>
            <p className={s.subtitle}>{deal.shortDescription}</p>
          </div>
          <div className={s.tags}>
            {deal.category && (
              <span className={`${s.tag} ${s.tagDefault}`}>
                {DEAL_CATEGORY_LABELS[deal.category] || deal.category}
              </span>
            )}
            {deal.audience && (
              <span className={`${s.tag} ${s.tagBrand}`}>
                {DEAL_AUDIENCE_LABELS[deal.audience] || deal.audience}
              </span>
            )}
          </div>
          {deal.teamsUsingCount > 0 && (
            <div className={s.meta}>
              <svg className={s.metaIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8 8C9.65685 8 11 6.65685 11 5C11 3.34315 9.65685 2 8 2C6.34315 2 5 3.34315 5 5C5 6.65685 6.34315 8 8 8Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 14C13 11.2386 10.7614 9 8 9C5.23858 9 3 11.2386 3 14"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{deal.teamsUsingCount} using</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
