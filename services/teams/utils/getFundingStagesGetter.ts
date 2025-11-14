import { FilterOption } from '@/services/filters';

type FundingStageItem = {
  selected: boolean;
  value: string;
  disabled: boolean;
};

/**
 * Get available funding stages for filtering
 *
 * Transforms server-side filter data into FilterOption format for GenericCheckboxList.
 *
 * @param fundingStages - Funding stages data from server
 * @returns Hook function compatible with GenericCheckboxList's useGetDataHook prop
 */
export function getFundingStagesGetter(fundingStages: FundingStageItem[] | undefined) {
  return (input: string): { data?: FilterOption[] } => {
    if (!fundingStages || fundingStages.length === 0) {
      return { data: [] };
    }

    const filtered = fundingStages.filter((stage) => {
      if (!input) return true;
      return stage.value.toLowerCase().includes(input.toLowerCase());
    });

    const data = filtered.map((stage) => ({
      value: stage.value,
      label: stage.value,
      disabled: stage.disabled,
    }));

    return { data };
  };
}
