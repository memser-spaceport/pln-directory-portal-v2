import { useMemo } from 'react';

import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { DEALS_LINK, FOUNDER_GUIDES_LINK, JOBS_LINK } from '@/components/core/navbar/constants/navLinks';
import { canViewFounderGuide } from '@/services/rbac/utils/founderGuide/canViewFounderGuide';

export function useMoreNavItems() {
  const { permissions } = usePermissions();

  const hasFounderGuidesAccess = canViewFounderGuide(permissions);

  return useMemo(
    () => [DEALS_LINK, ...(hasFounderGuidesAccess ? [FOUNDER_GUIDES_LINK] : []), JOBS_LINK],
    [hasFounderGuidesAccess],
  );
}
