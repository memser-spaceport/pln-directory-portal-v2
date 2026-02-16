'use client';

import clsx from 'clsx';
import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

import { DemoDayListResponse } from '@/services/demo-day/hooks/useGetDemoDaysList';

import { useDemoDayAnalytics } from '@/analytics/demoday.analytics';

import { Button } from '@/components/common/Button';

import { DemoDayStatus } from './types';

import { getStatusConfig } from './utils/getStatusConfig';

import { BadgeDot, CalendarIcon, ArrowRightIcon } from './components/Icons';

import s from './DemoDayCard.module.scss';

type DemoDayAccess = DemoDayListResponse['access'];

export type DemoDayCardProps = {
  slug: string;
  title: string;
  description: string;
  date: string;
  approximateStartDate?: string;
  status: DemoDayStatus;
  className?: string;
  isHighlighted?: boolean;
  access?: DemoDayAccess;
  logoUrl: string;
};

export const DemoDayCard: React.FC<DemoDayCardProps> = (props) => {
  const { slug, title, description, date, approximateStartDate, status, className, isHighlighted, access, logoUrl } =
    props;

  const { onDemoDayListCardClicked } = useDemoDayAnalytics();

  const statusConfig = getStatusConfig(status);
  const isCompleted = status === 'COMPLETED';
  const formattedDate = approximateStartDate || format(new Date(date), isCompleted ? 'd MMMM, yyyy' : 'MMMM, yyyy');
  const showMore = status !== 'UPCOMING';

  const handleDescriptionClick = (e: React.MouseEvent<HTMLParagraphElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.stopPropagation();
    }
  };

  const handleCardClick = () => {
    if (status === 'UPCOMING') {
      return;
    }

    onDemoDayListCardClicked({ demoDaySlug: slug, demoDayTitle: title, demoDayStatus: status });
  };

  return (
    <Link
      href={`/demoday/${slug}`}
      className={clsx(s.card, className, {
        [s.nonClickable]: status === 'UPCOMING',
        [s.highlighted]: isHighlighted,
        [s.completed]: isCompleted,
      })}
      onClick={(e) => {
        if (status === 'UPCOMING') {
          e.preventDefault();
        } else {
          handleCardClick();
        }
      }}
    >
      <div className={s.avatar}>
        <img src={logoUrl} alt={title} className={s.avatarImg} />
      </div>
      <div className={s.cardContent}>
        <div className={s.overline}>
          <div className={`${s.badge} ${statusConfig.className}`}>
            <BadgeDot />
            <span className={s.badgeText}>{statusConfig.label}</span>
          </div>
          <div className={s.date}>
            <CalendarIcon />
            <span className={s.dateText}>{formattedDate}</span>
          </div>
        </div>
        <div className={s.textBlock}>
          <h3 className={s.title}>{title}</h3>
          <p
            className={s.description}
            dangerouslySetInnerHTML={{ __html: description }}
            onClick={handleDescriptionClick}
          />
        </div>
      </div>
      {showMore && (
        <Button
          size="xs"
          className={s.moreButton}
          variant={isCompleted ? 'secondary' : 'primary'}
          style={['ACTIVE', 'REGISTRATION_OPEN'].includes(status) ? 'fill' : 'border'}
        >
          <span>More Info</span>
          <ArrowRightIcon />
        </Button>
      )}
    </Link>
  );
};
