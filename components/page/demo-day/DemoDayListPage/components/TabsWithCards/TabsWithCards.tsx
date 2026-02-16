import times from 'lodash/times';
import isEmpty from 'lodash/isEmpty';
import React, { useEffect, useState } from 'react';

import { DemoDayListResponse } from '@/services/demo-day/hooks/useGetDemoDaysList';

import { Tabs } from '@/components/common/Tabs';
import { DemoDayCardSkeleton } from '@/components/common/DemoDayCard';

import {
  TABS,
  PL_DEMO_DAYS_TAB,
  ALL_DEMO_DAYS_TAB,
  PARTNERS_DEMO_DAYS_TAB,
  CARDS_TO_SHOW_BY_DEFAULT,
} from './constants';

import { useGetVisibleDemoDays } from './hooks/useGetVisibleDemoDays';

import { SingleDemoDayTab } from './components/SingleDemoDayTab';

import s from './TabsWithCards.module.scss';

interface Props {
  loading?: boolean;
  highlightSlug?: string;
  demoDays: DemoDayListResponse[];
}

export function TabsWithCards(props: Props) {
  const { loading, demoDays, highlightSlug } = props;

  const [tab, setTab] = useState(ALL_DEMO_DAYS_TAB);

  const demoDaysByTab = useGetVisibleDemoDays(demoDays);
  const hideTabs = isEmpty(demoDaysByTab[PL_DEMO_DAYS_TAB]) || isEmpty(demoDaysByTab[PARTNERS_DEMO_DAYS_TAB]);

  const plDemoDays = demoDaysByTab[PL_DEMO_DAYS_TAB];
  useEffect(() => {
    if (plDemoDays.some((dd) => dd.status === 'ACTIVE' || dd.status === 'REGISTRATION_OPEN')) {
      setTab(PL_DEMO_DAYS_TAB);
    }
  }, [plDemoDays]);

  return (
    <div className={s.root}>
      {loading && times(CARDS_TO_SHOW_BY_DEFAULT, (i) => <DemoDayCardSkeleton key={i} />)}

      {!loading && !hideTabs && <Tabs tabs={TABS} value={tab} variant="pill" onValueChange={setTab as () => void} />}
      {!loading && <SingleDemoDayTab demoDays={demoDaysByTab[tab]} highlightSlug={highlightSlug} />}
    </div>
  );
}
