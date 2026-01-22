import { useMemo } from 'react';
import { PushNotification, IrlGatheringMetadata } from '@/types/push-notifications.types';
import { GatheringData } from '../types';
import { formatDateRange, buildEventsLink } from '../helpers';

/**
 * Hook for extracting and transforming IRL Gathering data from notification metadata
 * @param notification - The push notification containing gathering metadata
 * @returns Parsed and formatted gathering data
 */
export function useIrlGatheringData(notification: PushNotification): GatheringData {
  return useMemo(() => {
    const metadata = (notification.metadata || {}) as unknown as Partial<IrlGatheringMetadata>;

    const locationName = metadata.location?.name || 'TBD';
    const eventStartDate = metadata.events?.dates?.start;
    const eventEndDate = metadata.events?.dates?.end;

    // Map events from metadata to EventData format
    const events = (metadata.events?.items || []).map((item) => ({
      uid: item.uid,
      name: item.name,
      slug: item.slug,
      startDate: item.startDate,
      endDate: item.endDate,
      logoUrl: item.logoUrl,
      attendeeCount: item.attendeeCount,
      websiteUrl: item.websiteUrl,
    }));

    // Map teams from metadata to TeamOption format
    const teams = (metadata.teams || []).map((team) => ({
      uid: team.uid,
      name: team.name,
      logo: team.logo || null,
    }));

    return {
      gatheringName: metadata.location?.name || notification.title,
      gatheringImage: metadata.events?.items?.[0]?.logoUrl || undefined,
      aboutDescription: notification.description || '',
      dateRange: metadata.events?.dates
        ? formatDateRange(metadata.events.dates.start, metadata.events.dates.end)
        : 'TBD',
      locationName,
      eventsCount: metadata.events?.total || 0,
      events,
      attendees: (metadata.attendees?.topAttendees || []).map((a) => ({
        uid: a.memberUid,
        picture: a.imageUrl || undefined,
      })),
      attendeesCount: metadata.attendees?.total || 0,
      planningQuestion: `Are you planning to be in ${locationName}?`,
      resources: metadata.location?.resources || [],
      eventsLink: buildEventsLink(locationName, eventStartDate),
      gatheringUid: metadata.gatheringUid,
      eventDates: {
        start: eventStartDate,
        end: eventEndDate,
      },
      teams,
    };
  }, [notification]);
}

