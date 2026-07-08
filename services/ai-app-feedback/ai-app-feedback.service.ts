import { customFetch } from '@/utils/fetch-wrapper';

const AI_APPS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/ai-apps`;

export interface AiAppFeedback {
  uid: string;
  appUid: string;
  appName: string;
  message: string;
  memberUid: string;
  memberName: string;
  createdAt: string;
}

export async function submitAiAppFeedback(appUid: string, message: string): Promise<boolean> {
  const response = await customFetch(
    `${AI_APPS_API_URL}/${appUid}/feedback`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    },
    true, // withAuth
  );

  if (!response?.ok) {
    throw new Error('Failed to submit AI App feedback');
  }

  return true;
}

export async function fetchAiAppFeedbackList(): Promise<AiAppFeedback[]> {
  const response = await customFetch(`${AI_APPS_API_URL}/feedback`, { method: 'GET' }, true);

  if (!response || !response.ok) {
    return [];
  }

  return response.json();
}
