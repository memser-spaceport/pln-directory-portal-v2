import { useMemo } from 'react';

import { DemoDayListResponse } from '@/services/demo-day/hooks/useGetDemoDaysList';

import { ALL_DEMO_DAYS_TAB, PL_DEMO_DAYS_TAB, PARTNERS_DEMO_DAYS_TAB } from '../constants';

type DemoDaysByTab = Record<string, DemoDayListResponse[]>;

export function useGetVisibleDemoDays(demoDays: DemoDayListResponse[]) {
  const demoDaysByTab: DemoDaysByTab = useMemo(() => {
    // Filter out archived demo days
    const activeDemoDays = demoDays.filter((demoDay) => demoDay.status !== 'ARCHIVED');

    return {
      [ALL_DEMO_DAYS_TAB]: activeDemoDays,
      ...activeDemoDays.reduce(
        (acc: DemoDaysByTab, demoDay) => {
          const tabKey = demoDay.host === 'Protocol Labs' ? PL_DEMO_DAYS_TAB : PARTNERS_DEMO_DAYS_TAB;

          acc[tabKey].push(demoDay);

          return acc;
        },
        {
          [PL_DEMO_DAYS_TAB]: [],
          [PARTNERS_DEMO_DAYS_TAB]: [],
        },
      ),
    };
  }, [demoDays]);

  return demoDaysByTab;
}
