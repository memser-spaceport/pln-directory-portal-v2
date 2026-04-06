import { customFetch } from '@/utils/fetch-wrapper';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { toast } from '@/components/core/ToastContainer';

export interface GuideRequestPayload {
  title: string;
  description?: string;
}

const GUIDE_REQUESTS_API_URL = `${process.env.DIRECTORY_API_URL}/v1/articles/requests`;

export async function createGuideRequest(payload: GuideRequestPayload): Promise<boolean> {
  const { authToken } = getCookiesFromClient();

  const response = await customFetch(
    GUIDE_REQUESTS_API_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    },
    true,
  );

  if (response?.ok) {
    return true;
  } else {
    toast.error('Something went wrong. Please try again.');
    return false;
  }
}
