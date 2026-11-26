import { keepPreviousData, QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { revalidateAllEvents } from '@/app/actions/events.actions';
import { useCurrentUserStore } from '@/services/auth/store';
import { EventsQueryKeys } from '@/services/events/constants';

import {
  deleteEvent,
  getEventForEdit,
  getMyEvents,
  searchPlaces,
  submitEvent,
  updateEvent,
} from '../event-submission.service';
import type { SubmitEventBody, UpdateEventBody } from '../event-submission.types';

/** Every key a submit, an edit or a delete can make stale. */
const EVENT_WRITE_INVALIDATED_KEYS = [
  EventsQueryKeys.MY_EVENTS,
  EventsQueryKeys.EVENT_FOR_EDIT,
  EventsQueryKeys.EVENT_DETAIL,
  EventsQueryKeys.GET_UPCOMING_EVENTS,
  EventsQueryKeys.MEMBER_EVENTS,
  EventsQueryKeys.TEAM_EVENTS,
] as const;

/** After a write: the member's lists read again, and the All Events page drops its cached list. */
export async function refreshAfterEventWrite(queryClient: Pick<QueryClient, 'invalidateQueries'>) {
  await Promise.all([
    ...EVENT_WRITE_INVALIDATED_KEYS.map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
    revalidateAllEvents().catch(() => undefined),
  ]);
}

/** "Submit Event" and "Save as draft" on the submit form. */
export function useSubmitEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitEventBody) => submitEvent(body),
    onSuccess: () => refreshAfterEventWrite(queryClient),
  });
}

/** "Save as draft", "Submit" and "Save Changes" on the edit page. */
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, body }: { uid: string; body: UpdateEventBody }) => updateEvent(uid, body),
    onSuccess: () => refreshAfterEventWrite(queryClient),
  });
}

/** "Delete Event" on the edit page and in My Submissions. */
export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => deleteEvent(uid),
    onSuccess: () => refreshAfterEventWrite(queryClient),
  });
}

/** The signed-in member's own submissions. Off until there is a viewer, so the token fetch never runs signed out. */
export function useMyEvents(enabled = true) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;
  return useQuery({
    queryKey: [EventsQueryKeys.MY_EVENTS, viewerUid],
    queryFn: getMyEvents,
    enabled: enabled && !!viewerUid,
  });
}

/** One event for the edit page, read with the member's token. `null` when the backend answers 404. */
export function useEventForEdit(eventUid: string) {
  const { currentUser } = useCurrentUserStore();
  const viewerUid = currentUser?.uid ?? null;
  return useQuery({
    queryKey: [EventsQueryKeys.EVENT_FOR_EDIT, eventUid, viewerUid],
    queryFn: () => getEventForEdit(eventUid),
    enabled: !!eventUid && !!viewerUid,
    retry: false,
  });
}

/**
 * Venue suggestions for the text a person typed. The caller debounces `query`; the key holds it, so an answer for an
 * older text is never shown for a newer one.
 */
export function usePlaceSuggestions(query: string) {
  const text = query.trim();
  return useQuery({
    queryKey: [EventsQueryKeys.EVENT_PLACES, text],
    queryFn: () => searchPlaces(text),
    enabled: text.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
  });
}
