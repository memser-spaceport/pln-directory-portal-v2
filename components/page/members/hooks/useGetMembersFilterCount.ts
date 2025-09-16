import { useMemo } from 'react';

import { useFilterStore } from '@/services/members/store';

export function useGetMembersFilterCount() {
  const { params } = useFilterStore();

  const result = useMemo(() => {
    let count = 0;

    // List of filter parameters used in members filter
    // Update this array when adding new filter components
    let filterParams = [
      'search', // Search for a member
      'includeFriends', // FiltersPanelToggle - Include Friends of Protocol Labs
      'hasOfficeHours', // FiltersPanelToggle - Only Show Members with Office Hours
      'topics', // FilterMultiSelect - Add topic
      'roles', // FilterMultiSelect - Add roles
      'searchRoles', // RolesSearchFilter - Search Roles
    ];

    if (!params.get('hasOfficeHours')) {
      filterParams = filterParams.filter((param) => param !== 'topics');
    }

    filterParams.forEach((param) => {
      const value = params.get(param);
      // Check if the parameter exists and has a meaningful value
      // Exclude 'false' values as they represent disabled toggles
      if (value && value.trim() !== '' && value !== 'false') {
        count += 1;
      }
    });

    return count;
  }, [params]);

  return result;
}
