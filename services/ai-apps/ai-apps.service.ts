import { customFetch } from '@/utils/fetch-wrapper';

const AI_APPS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/ai-apps`;

export interface AiApp {
  uid: string;
  memberUid: string;
  appId: string;
  name: string;
  description: string;
  status: string;
  notes: string | null;
  url: string;
  httpUrl: string;
  host: string;
  port: number;
  deploymentId: string;
  createdAt: string;
  updatedAt: string;
  member: {
    uid: string;
    name: string;
  };
}

export async function fetchAiApps(): Promise<AiApp[]> {
  const response = await customFetch(AI_APPS_API_URL, { method: 'GET' }, true);

  if (!response || !response.ok) {
    return [];
  }

  return response.json();
}

export async function fetchAiApp(uid: string): Promise<AiApp | null> {
  const response = await customFetch(`${AI_APPS_API_URL}/${uid}`, { method: 'GET' }, true);

  if (!response || !response.ok) {
    return null;
  }

  return response.json();
}
