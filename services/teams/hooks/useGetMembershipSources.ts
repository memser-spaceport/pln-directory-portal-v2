import { FilterOption } from '@/services/filters';

type MembershipSourceItem = {
  selected: boolean;
  value: string;
  disabled: boolean;
};

/**
 * Get available membership sources for filtering
 *
 * Transforms server-side filter data into FilterOption format for GenericCheckboxList.
 * This is NOT a React hook - it's a factory function that creates a data hook.
 *
 * @param membershipSources - Membership sources data from server
 * @returns Hook function compatible with GenericCheckboxList's useGetDataHook prop
 */
export function useGetMembershipSources(membershipSources: MembershipSourceItem[] | undefined) {
  return (input: string): { data?: FilterOption[] } => {
    if (!membershipSources || membershipSources.length === 0) {
      return { data: [] };
    }

    const filtered = membershipSources.filter((source) => {
      if (!input) return true;
      return source.value.toLowerCase().includes(input.toLowerCase());
    });

    const data = filtered.map((source) => ({
      value: source.value,
      label: source.value,
      disabled: source.disabled,
    }));

    return { data };
  };
}
