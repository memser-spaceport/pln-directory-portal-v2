import { FilterOption } from '@/services/filters';

type TechnologyItem = {
  selected: boolean;
  value: string;
  disabled: boolean;
};

/**
 * Get available technologies for filtering
 *
 * Transforms server-side filter data into FilterOption format for GenericCheckboxList.
 *
 * @param technologies - Technologies data from server
 * @returns Hook function compatible with GenericCheckboxList's useGetDataHook prop
 */
export function getTechnologiesGetter(technologies: TechnologyItem[] | undefined) {
  return (input: string): { data?: FilterOption[] } => {
    if (!technologies || technologies.length === 0) {
      return { data: [] };
    }

    const filtered = technologies.filter((tech) => {
      if (!input) return true;
      return tech.value.toLowerCase().includes(input.toLowerCase());
    });

    const data = filtered.map((tech) => ({
      value: tech.value,
      label: tech.value,
      disabled: tech.disabled,
    }));

    return { data };
  };
}
