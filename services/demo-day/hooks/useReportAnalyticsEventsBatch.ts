import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';
import { TrackEventDto } from './useReportAnalyticsEvent';

/**
 * DTO for tracking multiple analytics events in batch
 * Matches backend BatchTrackDto
 */
export interface BatchTrackDto {
  events: TrackEventDto[];
}

// Legacy interface for backward compatibility
export interface AnalyticsEventsBatchData extends BatchTrackDto {}

async function reportAnalyticsEventsBatch(data: BatchTrackDto): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/analytics/batch`;

  const response = await customFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
    false, // Analytics events typically don't require authentication
  );

  if (!response?.ok) {
    throw new Error('Failed to report analytics events batch');
  }

  return true;
}

export function useReportAnalyticsEventsBatch() {
  return useMutation({
    mutationFn: reportAnalyticsEventsBatch,
    onError: (error) => {
      console.error('Failed to report analytics events batch:', error);
    },
  });
}

/**
 * Utility function to create a batch of analytics events
 * @param events - Array of analytics events to batch
 * @returns Formatted batch data ready for the API
 */
export function createAnalyticsEventsBatch(events: TrackEventDto[]): BatchTrackDto {
  return { events };
}

/**
 * Helper function to create multiple events with the same distinctId
 * @param distinctId - Common distinct ID for all events
 * @param eventConfigs - Array of event configurations (name and properties)
 * @returns Array of formatted analytics events
 */
export function createEventsForUser(
  distinctId: string,
  eventConfigs: Array<{ name: string; properties?: Record<string, any> }>
): TrackEventDto[] {
  return eventConfigs.map(config => ({
    name: config.name,
    distinctId,
    properties: config.properties,
  }));
}
