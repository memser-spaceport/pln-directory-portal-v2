import { useMemo } from 'react';

import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { DEALS_LINK, FOUNDER_GUIDES_LINK, JOBS_LINK, PLAA_LINK } from '@/components/core/navbar/constants/navLinks';
import { canViewFounderGuide } from '@/services/rbac/utils/founderGuide/canViewFounderGuide';
import { canViewPlaa } from '@/services/rbac/utils/plaa/canViewPlaa';

export function useMoreNavItems() {
  const { permissions, permsSet } = usePermissions();

  const hasFounderGuidesAccess = canViewFounderGuide(permissions);
  const hasPlaaAccess = canViewPlaa(permsSet);

  return useMemo(
    () => [
      DEALS_LINK,
      ...(hasFounderGuidesAccess ? [FOUNDER_GUIDES_LINK] : []),
      JOBS_LINK,
      ...(hasPlaaAccess ? [PLAA_LINK] : []),
    ],
    [hasFounderGuidesAccess, hasPlaaAccess],
  );
}
