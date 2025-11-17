import { FilterOption } from '@/services/filters';

type TagItem = {
  selected: boolean;
  value: string;
  disabled: boolean;
};

/**
 * Get available team tags (industry tags) for filtering
 *
 * Transforms server-side filter data into FilterOption format for GenericCheckboxList.
 *
 * @param tags - Tags data from server
 * @returns Hook function compatible with GenericCheckboxList's useGetDataHook prop
 */
export function getTeamTagsGetter(tags: TagItem[] | undefined) {
  return (input: string): { data?: FilterOption[] } => {
    if (!tags || tags.length === 0) {
      return { data: [] };
    }

    const filtered = tags.filter((tag) => {
      if (!input) return true;
      return tag.value.toLowerCase().includes(input.toLowerCase());
    });

    const data = filtered.map((tag) => ({
      value: tag.value,
      label: tag.value,
      disabled: tag.disabled,
    }));

    return { data };
  };
}
