import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
import { TOAST_MESSAGES } from '@/utils/constants';

async function mutation({ uid }: { uid: string }) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/linkedin-verification/auth-url`;
  const payload = {
    memberUid: uid,
    redirectUrl: `${window.location.origin}/members/${uid}`,
  };

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    true,
  );

  if (!response?.ok) {
    throw new Error('Failed to fetch linkedin verification');
  }

  const res = await response.json();

  if (res.authUrl) {
    window.location.href = res.authUrl;
  }
}

export function useLinkedInVerification() {
  return useMutation({
    mutationFn: mutation,
    onError: (error) => {
      console.error(error?.message);
      toast.error(TOAST_MESSAGES.FAILED_TO_LINK_LINKEDIN);
    },
  });
}
