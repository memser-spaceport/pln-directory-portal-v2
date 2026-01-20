import { useCallback } from 'react';
import { useCreateIrlGatheringGuest } from '@/services/events/hooks/useCreateIrlGatheringGuest';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { toast } from '@/components/core/ToastContainer';
import { IrlGatheringFormData, GatheringData } from '../types';
import { formatDateForApi } from '../helpers';

interface UseIrlGatheringSubmitParams {
  gatheringData: GatheringData;
  selectedDateRange: [Date, Date] | null;
  onSuccess: () => void;
}

interface UseIrlGatheringSubmitReturn {
  handleSubmit: (data: IrlGatheringFormData) => void;
  isPending: boolean;
}

/**
 * Hook for handling IRL Gathering form submission
 * Creates a guest registration for the gathering
 */
export function useIrlGatheringSubmit({
  gatheringData,
  selectedDateRange,
  onSuccess,
}: UseIrlGatheringSubmitParams): UseIrlGatheringSubmitReturn {
  const { mutate: createGuest, isPending } = useCreateIrlGatheringGuest();
  const { userInfo } = getCookiesFromClient();

  const handleSubmit = useCallback(
    (data: IrlGatheringFormData) => {
      if (!userInfo?.uid || !gatheringData.gatheringUid) {
        console.error('Missing required data for submission');
        return;
      }

      // Use selected date range or fall back to event dates from metadata
      const checkInDate = selectedDateRange
        ? formatDateForApi(selectedDateRange[0])
        : gatheringData.eventDates.start
          ? formatDateForApi(new Date(gatheringData.eventDates.start))
          : '';
      const checkOutDate = selectedDateRange
        ? formatDateForApi(selectedDateRange[1])
        : gatheringData.eventDates.end
          ? formatDateForApi(new Date(gatheringData.eventDates.end))
          : '';

      // Transform selected event UIDs into the expected payload format
      const eventsPayload = (data.selectedEventUids || []).map((uid) => ({
        uid,
        isHost: false,
        isSpeaker: false,
        isSponsor: false,
        hostSubEvents: [],
        speakerSubEvents: [],
        sponsorSubEvents: [],
      }));

      const payload = {
        memberUid: userInfo.uid,
        teamUid: userInfo.leadingTeams?.[0] || '',
        reason: '',
        telegramId: '',
        officeHours: '',
        events: eventsPayload,
        additionalInfo: {
          checkInDate,
          checkOutDate,
        },
        topics: data.topics,
        locationName: gatheringData.locationName,
      };

      createGuest(
        {
          locationId: gatheringData.gatheringUid,
          payload,
          type: 'upcoming',
        },
        {
          onSuccess: () => {
            toast.success(`You're going to ${gatheringData.locationName}!`);
            onSuccess();
          },
          onError: (error) => {
            console.error('Failed to create IRL gathering guest:', error);
            toast.error(error?.message ?? 'Failed to register for the gathering. Please try again.');
          },
        },
      );
    },
    [userInfo, gatheringData, selectedDateRange, createGuest, onSuccess],
  );

  return {
    handleSubmit,
    isPending,
  };
}

