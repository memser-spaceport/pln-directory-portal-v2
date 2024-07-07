import { getQuery } from '@/utils/common.utils';
import { ROLE_FILTER_QUERY_NAME, URL_QUERY_VALUE_SEPARATOR } from '@/utils/constants';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import useUpdateQueryParams from './useUpdateQueryParams';

export function useRolesFilter(filterRoles: any[], searchParams:any) {
  const router = useRouter();
  const pathname = usePathname();
  const [roles, setRoles] = useState(filterRoles);
  const { updateQueryParams } = useUpdateQueryParams();

  const query = getQuery(searchParams);

  useEffect(() => {
    setRoles(filterRoles);
  }, [filterRoles]);

  const toggleRole = useCallback(
    (selectedRole: any) => {
      // const { [ROLE_FILTER_QUERY_NAME]: queryFilterValue } = query;
      let updatedRoles = [...roles];
      if (!selectedRole?.default && updatedRoles.indexOf(selectedRole) > 0) {
        const selectedIndex = [...roles].indexOf(selectedRole);
        updatedRoles.splice(selectedIndex, 1);
      } else if (!selectedRole?.default && [...roles].indexOf(selectedRole) === -1) {
        updatedRoles = [...roles, { ...selectedRole, selected: true }];
      } else {
        updatedRoles = roles.map((item) => (item.role === selectedRole.role ? { ...item, selected: !item.selected } : item));
      }

      const selectedRoles = updatedRoles.filter((role) => role.selected).map((item) => item.role);

      updateQueryParams(ROLE_FILTER_QUERY_NAME, selectedRoles.join(URL_QUERY_VALUE_SEPARATOR), searchParams);
    },
    [query, router, pathname, roles, setRoles, filterRoles]
  );

  const unSelectAllRole = useCallback(() => {
    // const { [ROLE_FILTER_QUERY_NAME]: queryFilterValue,} = query;
    const updatedRoles = roles.filter((role) => role.default);
    const newroles = updatedRoles?.filter((role) => role.selected).map((item) => item.role);

    updateQueryParams(ROLE_FILTER_QUERY_NAME, newroles.join(URL_QUERY_VALUE_SEPARATOR), searchParams);
  }, [query, pathname, roles, setRoles]);

  const selectAllRole = useCallback(
    (selectedRoles: any) => {
      // const { [ROLE_FILTER_QUERY_NAME]: queryFilterValue } = query;
      selectedRoles.map((role: any) => {
        role.selected = true;
        return role;
      });
      const updatedRoles = [...new Set([...roles, ...selectedRoles])];
      const newroles = updatedRoles?.filter((role) => role.selected).map((item) => item.role);

    updateQueryParams(ROLE_FILTER_QUERY_NAME, newroles.join(URL_QUERY_VALUE_SEPARATOR), searchParams);
    },
    [query, pathname, roles, setRoles]
  );

  return [roles, toggleRole, selectAllRole, unSelectAllRole] as const;
}
