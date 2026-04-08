import { customFetch } from '@/utils/fetch-wrapper';

const RBAC_API_URL = `${process.env.DIRECTORY_API_URL}/v1/rbac`;

export interface RbacPermission {
  name: string;
  scopes: string[];
}

export interface RbacMeResponse {
  roles: string[];
  permissions: RbacPermission[];
}

export async function fetchRbacMe(): Promise<RbacMeResponse> {
  const response = await customFetch(`${RBAC_API_URL}/me`, { method: 'GET' }, true);
  if (!response || !response.ok) {
    return { roles: [], permissions: [] };
  }
  return response.json();
}
