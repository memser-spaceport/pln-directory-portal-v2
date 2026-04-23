/**
 * @deprecated Use `services/access-control/access-control.service.ts` instead.
 * This service calls the legacy /v1/rbac/me endpoint and will be removed once all callers are migrated.
 */
import { customFetch } from '@/utils/fetch-wrapper';

const RBAC_API_URL = `${process.env.DIRECTORY_API_URL}/v1/rbac`;

export interface RbacPermission {
  name: string;
  scopes: string[];
}

export interface RbacMeResponse {
  memberUid: string;
  roles: string[];
  permissions: RbacPermission[];
}

export async function fetchRbacMe(): Promise<RbacMeResponse> {
  const response = await customFetch(`${RBAC_API_URL}/me`, { method: 'GET' }, true);

  if (!response || !response.ok) {
    return { roles: [], permissions: [], memberUid: '' };
  }
  return response.json();
}
