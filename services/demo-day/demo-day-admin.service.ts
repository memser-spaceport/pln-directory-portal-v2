import { customFetch } from '@/utils/fetch-wrapper';

const DEMO_DAY_ADMIN_API_URL = `${process.env.DIRECTORY_API_URL}/v1/admin/demo-days`;

export interface DemoDayReportLinkResponse {
  url: string;
}

export async function fetchDemoDayReportLink(): Promise<DemoDayReportLinkResponse | null> {
  const response = await customFetch(`${DEMO_DAY_ADMIN_API_URL}/report-link`, { method: 'GET' }, true);
  if (!response || !response.ok) {
    return null;
  }
  return response.json();
}
