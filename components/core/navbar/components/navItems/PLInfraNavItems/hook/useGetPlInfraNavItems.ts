import { usePermissions } from '@/services/rbac/hooks/usePermissions';
import { canViewGantry } from '@/services/rbac/utils/gantry/canViewGantry';
import { canViewAiApps } from '@/services/rbac/utils/aiApps/canViewAiApps';
import { canViewAgentSessions } from '@/services/rbac/utils/agentSessions/canViewAgentSessions';
// import { canViewFounderDb } from '@/services/rbac/utils/founderDb/canViewFounderDb';
import { canViewInvestorDb } from '@/services/rbac/utils/investorDb/canViewInvestorDb';

import {
  AGENT_SESSIONS_LINK,
  AI_APPS_LINK,
  // FOUNDER_DB_LINK,
  GANTRY_LINK,
  INVESTOR_DB_LINK,
} from '@/components/core/navbar/constants/navLinks';
import { useMemo } from 'react';

export function useGetPlInfraNavItems() {
  const { permsSet } = usePermissions();

  const hasGantryAccess = canViewGantry(permsSet);
  const hasAiAppsAccess = canViewAiApps(permsSet);
  const hasAgentSessionsAccess = canViewAgentSessions(permsSet);
  // const hasFounderDbAccess = canViewFounderDb(permsSet);
  const hasInvestorDbAccess = canViewInvestorDb(permsSet);

  return useMemo(
    () => [
      ...(hasGantryAccess ? [GANTRY_LINK] : []),
      ...(hasInvestorDbAccess ? [INVESTOR_DB_LINK] : []),
      // ...(hasFounderDbAccess ? [FOUNDER_DB_LINK] : []),
      ...(hasAiAppsAccess ? [AI_APPS_LINK] : []),
      ...(hasAgentSessionsAccess ? [AGENT_SESSIONS_LINK] : []),
    ],
    [hasGantryAccess, hasAiAppsAccess, hasAgentSessionsAccess, hasInvestorDbAccess],
  );
}
