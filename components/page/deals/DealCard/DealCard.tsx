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
  const IconComponent = DEAL_ICONS[deal.title.toLowerCase()];

  return (
    <Link href={`/deals/${deal.id}`} className={s.card}>
      <div className={s.content}>
        <div className={s.avatar}>
          {IconComponent ? <IconComponent /> : <div className={s.avatarPlaceholder}>{deal.title.charAt(0)}</div>}
        </div>
        <div className={s.details}>
          <div className={s.description}>
            <h3 className={s.title}>{deal.title}</h3>
            <p className={s.subtitle}>{deal.description}</p>
          </div>
          <div className={s.tags}>
            {deal.categories.map((cat) => (
              <span key={cat} className={`${s.tag} ${s.tagDefault}`}>
                {DEAL_CATEGORY_LABELS[cat] || cat}
              </span>
            ))}
            {deal.audience.map((aud) => (
              <span key={aud} className={`${s.tag} ${aud === 'pl-funded-founders' ? s.tagBrand : s.tagDefault}`}>
                {DEAL_AUDIENCE_LABELS[aud] || aud}
              </span>
            ))}
          </div>
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
            <span>{deal.usersCount} using</span>
            <span className={s.metaDot} />
            {deal.issuesCount === 0 ? (
              <>
                <svg className={s.metaIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 8L7 9.5L10.5 6"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>No issues</span>
              </>
            ) : (
              <>
                <svg className={s.metaIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M8 5.5V8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="8" cy="10.5" r="0.5" fill="currentColor" />
                </svg>
                <span>
                  {deal.issuesCount} {deal.issuesCount === 1 ? 'Issue' : 'Issues'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
