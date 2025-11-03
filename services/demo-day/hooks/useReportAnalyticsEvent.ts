import { useMutation } from '@tanstack/react-query';
import { customFetch } from '@/utils/fetch-wrapper';

/**
 * DTO for tracking a single analytics event
 * Matches backend TrackEventDto
 */
export interface TrackEventDto {
  name: string;
  distinctId: string;
  properties?: Record<string, any>;
}

// Legacy interface for backward compatibility
export interface AnalyticsEventData extends TrackEventDto {}

// Common properties interface for convenience
export interface AnalyticsEventProperties {
  eventId?: string;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  anonymousId?: string;
  path?: string;
  referrer?: string;
  ts?: string;
  label?: string;
  [key: string]: any; // Allow additional custom properties
}

async function reportAnalyticsEvent(data: TrackEventDto): Promise<boolean> {
  const url = `${process.env.DIRECTORY_API_URL}/analytics/track`;

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
    throw new Error('Failed to report analytics event');
  }

  return true;
}

export function useReportAnalyticsEvent() {
  return useMutation({
    mutationFn: reportAnalyticsEvent,
    onError: (error) => {
      console.error('Failed to report analytics event:', error);
    },
  });
}
