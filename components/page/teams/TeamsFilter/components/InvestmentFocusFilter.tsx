import React from 'react';

import { useTeamFilterStore } from '@/services/teams';
import { FilterTagInput } from '@/components/form/FilterTagInput';

export function InvestmentFocusFilter() {
  const { params } = useTeamFilterStore();

  return (
    <FilterTagInput
      selectLabel="Investment Focus"
      paramKey="investmentFocus"
      filterStore={useTeamFilterStore}
      placeholder="E.g. AI, Staking, Governance"
      disabled={!params.get('isFund')}
    />
  );
}
