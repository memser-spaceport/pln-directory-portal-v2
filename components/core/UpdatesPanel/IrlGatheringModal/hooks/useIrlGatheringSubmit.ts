import { useCallback } from 'react';
import { useCreateIrlGatheringGuest } from '@/services/events/hooks/useCreateIrlGatheringGuest';
import { useEditIrlGatheringGuest } from '@/services/events/hooks/useEditIrlGatheringGuest';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { toast } from '@/components/core/ToastContainer';
import { IrlGatheringFormData, GatheringData } from '../types';
import { formatDateForApi } from '../helpers';

interface UseIrlGatheringSubmitParams {
  gatheringData: GatheringData;
  selectedDateRange: [Date, Date] | null;
  onSuccess: () => void;
  isEditMode?: boolean;
  guestUid?: string;
}

interface UseIrlGatheringSubmitReturn {
  handleSubmit: (data: IrlGatheringFormData) => void;
  isPending: boolean;
}

/**
 * Hook for handling IRL Gathering form submission
 * Creates or edits a guest registration for the gathering
 */
export function useIrlGatheringSubmit({
  gatheringData,
  selectedDateRange,
  onSuccess,
  isEditMode = false,
  guestUid,
}: UseIrlGatheringSubmitParams): UseIrlGatheringSubmitReturn {
  const { mutate: createGuest, isPending: isCreatePending } = useCreateIrlGatheringGuest();
  const { mutate: editGuest, isPending: isEditPending } = useEditIrlGatheringGuest();
  const { userInfo } = getCookiesFromClient();
  const isPending = isCreatePending || isEditPending;

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
      const eventsPayload = (data.selectedEventUids || []).map((uid) => {
        const eventRoleSelection = data.eventRoles?.find((er) => er.eventUid === uid);
        const roles = eventRoleSelection?.roles || [];
        const eventData = gatheringData.events.find((e) => e.uid === uid);

        const isHost = roles.includes('Host');
        const isSpeaker = roles.includes('Speaker');

        // Create sub-event object with event details
        const subEventData = eventData
          ? { uid, name: eventData.name, link: eventData.websiteUrl || '' }
          : { uid, name: '', link: '' };

        return {
          uid,
          isHost,
          isSpeaker,
          isSponsor: false, // Sponsor role is not available in the form UI
          hostSubEvents: isHost ? [subEventData] : [],
          speakerSubEvents: isSpeaker ? [subEventData] : [],
          sponsorSubEvents: [],
        };
      });

      const payload = {
        memberUid: userInfo.uid,
        teamUid: data.selectedTeam?.value || userInfo.leadingTeams?.[0] || '',
        reason: data.additionalDetails || '',
        telegramId: data.telegramHandle || '',
        officeHours: data.officeHours || '',
        events: eventsPayload,
        additionalInfo: {
          checkInDate,
          checkOutDate,
        },
        topics: data.topics,
        locationName: gatheringData.locationName,
      };

      if (isEditMode && guestUid) {
        editGuest(
          {
            locationId: gatheringData.gatheringUid,
            guestUid,
            payload,
            type: 'upcoming',
          },
          {
            onSuccess: () => {
              toast.success('Your details have been updated!');
              onSuccess();
            },
            onError: (error) => {
              console.error('Failed to update IRL gathering guest:', error);
              toast.error(error?.message ?? 'Failed to update your details. Please try again.');
            },
          },
        );
      } else {
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
      }
    },
    [userInfo, gatheringData, selectedDateRange, createGuest, editGuest, onSuccess, isEditMode, guestUid],
  );

  return {
    handleSubmit,
    isPending,
  };
}
