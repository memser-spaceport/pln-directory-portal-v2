import { useMutation } from '@tanstack/react-query';
import { createEventGuest } from '@/services/irl.service';

export interface IrlGatheringEventPayload {
  uid: string;
  isHost: boolean;
  isSpeaker: boolean;
  isSponsor: boolean;
  hostSubEvents: string[];
  speakerSubEvents: string[];
  sponsorSubEvents: string[];
}

export interface IrlGatheringGuestPayload {
  memberUid: string;
  teamUid: string;
  reason: string;
  telegramId: string;
  officeHours: string;
  events: IrlGatheringEventPayload[];
  additionalInfo: {
    checkInDate: string;
    checkOutDate: string;
  };
  topics: string[];
  locationName: string;
}

interface MutationParams {
  locationId: string;
  payload: IrlGatheringGuestPayload;
  type: 'upcoming' | 'past';
}

async function mutation({ locationId, payload, type }: MutationParams) {
  const result = await createEventGuest(locationId, payload, type);

  if (result.error) {
    const err = await result?.error?.json();

    const msg =
      err?.message && err.message.startsWith('Guest already exists')
        ? 'Guest already exists for this location'
        : (err?.message ?? 'Failed to create IRL gathering guest');

    throw new Error(msg);
  }

  return result.data;
}

export function useCreateIrlGatheringGuest() {
  return useMutation({
    mutationFn: mutation,
  });
}
