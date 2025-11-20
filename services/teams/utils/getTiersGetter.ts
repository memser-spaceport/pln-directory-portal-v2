import { FilterOption } from '@/services/filters';

type TierItem = {
  value: string;
  count: number;
  selected: boolean;
  disabled: boolean;
};

/**
 * Get available team tiers for filtering
 *
 * Transforms server-side tier data into FilterOption format for GenericCheckboxList.
 *
 * @param tiers - Tiers data from server
 * @returns Hook function compatible with GenericCheckboxList's useGetDataHook prop
 */
export function getTiersGetter(tiers: TierItem[] | undefined) {
  return (input: string): { data?: FilterOption[] } => {
    if (!tiers || tiers.length === 0) {
      return { data: [] };
    }

    const filtered = tiers.filter((tier) => {
      if (!input) return true;
      return tier.value.toLowerCase().includes(input.toLowerCase());
    });

    const data = filtered.map((tier) => ({
      value: String(tier.value),
      label: `Tier ${tier.value}`,
      disabled: tier.disabled,
      count: tier.count,
    }));

    return { data };
  };
}
