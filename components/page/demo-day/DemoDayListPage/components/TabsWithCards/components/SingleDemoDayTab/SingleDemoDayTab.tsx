import React, { useEffect, useMemo } from 'react';
import isEmpty from 'lodash/isEmpty';
import { useToggle } from 'react-use';

import { DemoDayListResponse } from '@/services/demo-day/hooks/useGetDemoDaysList';

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';

import { Button } from '@/components/common/Button';
import { DemoDayCard } from '@/components/common/DemoDayCard';

import { CARDS_TO_SHOW_BY_DEFAULT } from '../../constants';

import s from './SingleDemoDayTab.module.scss';

interface Props {
  highlightSlug?: string;
  demoDays: DemoDayListResponse[];
}

export function SingleDemoDayTab(props: Props) {
  const { demoDays, highlightSlug } = props;

  const [showAll, toggleShowAll] = useToggle(false);

  useEffect(() => {
    toggleShowAll(false);
  }, [demoDays]);

  const visibleDemoDays = useMemo(
    () => (showAll ? demoDays : demoDays?.slice(0, CARDS_TO_SHOW_BY_DEFAULT)),
    [showAll, demoDays],
  );

  return (
    <>
      {isEmpty(demoDays) ? (
        <div className={s.empty}>No demo days available</div>
      ) : (
        visibleDemoDays.map((demoDay) => (
          <DemoDayCard
            key={demoDay.slugURL}
            slug={demoDay.slugURL}
            title={demoDay.title}
            description={demoDay.shortDescription || demoDay.description}
            date={demoDay.date}
            approximateStartDate={demoDay.approximateStartDate}
            status={demoDay.status}
            isHighlighted={highlightSlug === demoDay.slugURL}
            access={demoDay.access}
            logoUrl={demoDay.logoUrl || getDefaultAvatar(demoDay.slugURL)}
          />
        ))
      )}

      {demoDays.length > CARDS_TO_SHOW_BY_DEFAULT && (
        <Button size="m" style="border" variant="secondary" onClick={toggleShowAll} className={s.showAll}>
          {showAll ? 'Show Less' : 'Show All'}
        </Button>
      )}
    </>
  );
}
