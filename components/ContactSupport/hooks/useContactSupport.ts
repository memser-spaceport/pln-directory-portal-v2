import { useMutation } from '@tanstack/react-query';
import { toast } from '@/components/core/ToastContainer';
import { Metadata } from '@/components/ContactSupport/types';

export type ContactSupportPayload = {
  topic: string;
  email: string;
  name: string;
  message: string;
  metadata?: Metadata;
};

async function mutation(payload: ContactSupportPayload) {
  const response = await fetch('/api/contact-support', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response?.ok) {
    let errorMessage = 'Failed to send your message. Please try again.';

    try {
      const res = await response?.json();
      errorMessage = res?.error || res?.message || errorMessage;
    } catch (e) {
      // If JSON parsing fails, use default error message
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

export function useContactSupport() {
  return useMutation({
    mutationFn: (payload: ContactSupportPayload) => mutation(payload),
    onSuccess: () => {
      toast.success('Thanks! We have received your request and will be in touch soon.', {
        style: {
          width: 520,
        },
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send your message. Please try again.');
    },
  });
}
