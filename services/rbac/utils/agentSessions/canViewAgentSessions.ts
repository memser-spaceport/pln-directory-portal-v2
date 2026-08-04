import { PERMISSIONS } from '@/services/rbac/constants';

export function canViewAgentSessions(permissions: Set<string>) {
  return (
    permissions.has(PERMISSIONS.AGENT_SESSIONS.PERM_VIEW) || permissions.has(PERMISSIONS.AGENT_SESSIONS.PERM_ADMIN)
  );
}
