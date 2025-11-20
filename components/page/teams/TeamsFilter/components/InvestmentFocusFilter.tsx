import React, { useCallback } from 'react';

import { triggerLoader } from '@/utils/common.utils';
import { useTeamFilterStore } from '@/services/teams';
import { FilterTagInput } from '@/components/form/FilterTagInput';

export function InvestmentFocusFilter() {
  const { params } = useTeamFilterStore();

  const onChange = useCallback(() => {
    triggerLoader(true);
  }, []);

  return (
    <FilterTagInput
      selectLabel="Investment Focus"
      paramKey="investmentFocus"
      filterStore={useTeamFilterStore}
      placeholder="E.g. AI, Staking, Governance"
      disabled={!params.get('isFund')}
      onChange={onChange}
    />
  );
}
