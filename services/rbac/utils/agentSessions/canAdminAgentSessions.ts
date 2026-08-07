import { PERMISSIONS } from '@/services/rbac/constants';

export function canAdminAgentSessions(permissions: Set<string>) {
  return permissions.has(PERMISSIONS.AGENT_SESSIONS.PERM_ADMIN);
}
