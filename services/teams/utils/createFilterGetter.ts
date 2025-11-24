import { FilterOption } from '@/services/filters';

/**
 * Base interface for filter items with common properties
 */
interface BaseFilterItem {
  value: string;
  disabled: boolean;
  count?: number;
}

/**
 * Options for customizing the filter getter behavior
 */
interface FilterGetterOptions<T extends BaseFilterItem> {
  /**
   * Custom function to format the label for each item
   * @param item - The filter item
   * @returns The formatted label string
   */
  formatLabel?: (item: T) => string;
}

/**
 * Generic factory function to create filter getter functions
 * Eliminates duplication across getMembershipSourcesGetter, getFundingStagesGetter,
 * getTeamTagsGetter, and getTiersGetter
 *
 * All these functions share the same pattern:
 * 1. Check if data exists
 * 2. Filter by search input (case-insensitive)
 * 3. Map to FilterOption format with optional label customization
 *
 * @param items - Array of filter items from server
 * @param options - Optional configuration for label formatting
 * @returns Hook function compatible with GenericCheckboxList's useGetDataHook prop
 *
 * @example
 * ```typescript
 * // Simple usage (label = value)
 * export function getTeamTagsGetter(tags?: CheckboxFilterOption[]) {
 *   return createFilterGetter(tags);
 * }
 *
 * // With custom label formatting
 * export function getTiersGetter(tiers?: TierItem[]) {
 *   return createFilterGetter(tiers, {
 *     formatLabel: (tier) => `Tier ${tier.value}`
 *   });
 * }
 * ```
 */
export function createFilterGetter<T extends BaseFilterItem>(
  items: T[] | undefined,
  options?: FilterGetterOptions<T>
) {
  const { formatLabel = (item: T) => item.value } = options || {};

  return (input: string): { data?: FilterOption[] } => {
    if (!items || items.length === 0) {
      return { data: [] };
    }

    // Filter by search input (case-insensitive)
    const filtered = items.filter((item) => {
      if (!input) return true;
      return item.value.toLowerCase().includes(input.toLowerCase());
    });

    // Map to FilterOption format
    const data = filtered.map((item) => ({
      value: String(item.value),
      label: formatLabel(item),
      disabled: item.disabled,
      ...(item.count !== undefined && { count: item.count }),
    }));

    return { data };
  };
}
