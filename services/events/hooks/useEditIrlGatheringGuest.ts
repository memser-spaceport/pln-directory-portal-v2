import { useMutation } from '@tanstack/react-query';
import { editEventGuest } from '@/services/irl.service';
import { IrlGatheringGuestPayload } from './useCreateIrlGatheringGuest';

interface MutationParams {
  locationId: string;
  guestUid: string;
  payload: IrlGatheringGuestPayload;
  type: 'upcoming' | 'past';
}

async function mutation({ locationId, guestUid, payload, type }: MutationParams) {
  const result = await editEventGuest(locationId, guestUid, payload, type);

  if (result.error) {
    const err = await result?.error?.json();
    const msg = err?.message ?? 'Failed to update IRL gathering guest';
    throw new Error(msg);
  }

  return result.data;
}

export function useEditIrlGatheringGuest() {
  return useMutation({
    mutationFn: mutation,
  });
}

