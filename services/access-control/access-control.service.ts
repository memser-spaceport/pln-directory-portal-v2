import { customFetch } from '@/utils/fetch-wrapper';

const ACCESS_CONTROL_API_URL = `${process.env.DIRECTORY_API_URL}/v2/access-control-v2`;

export interface AccessControlPolicy {
  uid: string;
  code: string;
  name: string;
  role: string;
  group: string;
  permissions: string[];
}

export interface MyAccessResponse {
  memberUid: string;
  policies: AccessControlPolicy[];
  directPermissions: string[];
  effectivePermissions: string[];
}

const EMPTY_ACCESS: MyAccessResponse = {
  memberUid: '',
  policies: [],
  directPermissions: [],
  effectivePermissions: [],
};

export async function fetchMyAccess(): Promise<MyAccessResponse> {
  const response = await customFetch(`${ACCESS_CONTROL_API_URL}/me/access`, { method: 'GET' }, true);

  if (!response || !response.ok) {
    return EMPTY_ACCESS;
  }
  return response.json();
}
