import React from 'react';

import { useGetDemoDayState } from '@/services/demo-day/hooks/useGetDemoDayState';
import { DemoDayState } from '@/app/actions/demo-day.actions';

import s from './PageTitle.module.scss';

interface PageTitleProps {
  size?: 'small' | 'large';
  initialDemoDayState?: DemoDayState;
  subtitle?: React.ReactNode;
  /** When set, used instead of demo day state (e.g. team pitch pages). */
  title?: string;
  description?: string;
}

export function PageTitle(props: PageTitleProps) {
  const {
    size = 'large',
    initialDemoDayState,
    subtitle,
    title: titleOverride,
    description: descriptionOverride,
  } = props;
  const useDemoDayState = titleOverride === undefined && descriptionOverride === undefined;
  const { data: loadedDemoDayData } = useGetDemoDayState(initialDemoDayState, { enabled: useDemoDayState });
  const data = loadedDemoDayData || initialDemoDayState;

  const title = titleOverride ?? data?.title ?? '';
  const description = descriptionOverride ?? data?.description ?? data?.shortDescription ?? '';

  return (
    <div className={s.root}>
      <h1 className={`${s.title} ${size === 'small' && s.small}`}>{title}</h1>
      {description ? (
        <p
          className={`${s.description} ${size === 'small' && s.small}`}
          dangerouslySetInnerHTML={{ __html: description }}
        />
      ) : null}
      {subtitle ? <div className={s.subtitle}>{subtitle}</div> : null}
    </div>
  );
}
