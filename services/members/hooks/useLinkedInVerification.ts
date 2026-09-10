import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { toast } from '@/components/core/ToastContainer';
import { TOAST_MESSAGES } from '@/utils/constants';

/**
 * `redirectUrl` is where LinkedIn sends them back, and it is the caller's
 * because the answer depends on where they started.
 *
 * It was `${origin}/members/${uid}`, hard-coded — correct while the member
 * profile page was the only host, and wrong the moment a second one existed:
 * this navigates the whole page away (see below), so a caller inside the job
 * board's apply flow would have handed someone a round trip that ends on their
 * profile with the application they were making nowhere in sight.
 *
 * Absolute, not a path: it leaves this origin and has to come back to it.
 */
async function mutation({ uid, redirectUrl }: { uid: string; redirectUrl: string }) {
  const url = `${process.env.DIRECTORY_API_URL}/v1/linkedin-verification/auth-url`;
  const payload = {
    memberUid: uid,
    redirectUrl,
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
