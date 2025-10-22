import { useMemo } from 'react';
import isEmpty from 'lodash/isEmpty';

type FundingStageOptions = {
  label: string;
  value: string;
};

// TODO implement proper typing
export function useGetFundingStageOptions(fundingStages?: any): FundingStageOptions[] {
  const options = useMemo(() => {
    if (isEmpty(fundingStages)) {
      return [];
    }

    return [
      ...fundingStages
        .filter((val: { id: any; name: any }) => val.name !== 'Not Applicable')
        .map((val: { id: any; name: any }) => ({
          value: val.name,
          label: val.name,
        })),
      { value: 'Series D and later', label: 'Series D and later' },
    ];
  }, [fundingStages]);

  return options;
}
