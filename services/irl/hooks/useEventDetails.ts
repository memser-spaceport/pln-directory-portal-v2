import { useQuery } from '@tanstack/react-query';
import { IrlQueryKeys } from '@/services/irl/constants';
import { getParsedValue } from '@/utils/common.utils';
import Cookies from 'js-cookie';
import { getGuestEvents, getGuestsByLocation, getTopicsByLocation } from '@/services/irl.service';
import { getFilteredEventsForUser, parseSearchParams } from '@/utils/irl.utils';
import { IUserInfo } from '@/types/shared.types';
import { IGuestDetails, IIrlEvent } from '@/types/irl.types';

type QueryParams = {
  location: string;
  eventType: string;
  currentEventNames: string[];
  searchParams: any;
  userInfo: IUserInfo;
  events: IIrlEvent[];
  isLoggedIn: boolean;
};

async function fetcher(queryParams: QueryParams) {
  const authToken = getParsedValue(Cookies.get('authToken'));
  const { location, eventType, currentEventNames, searchParams, userInfo, events, isLoggedIn } = queryParams;

  const [eventInfo, currentGuestResponse, topics, loggedInUserEvents]: any = await Promise.all([
    await getGuestsByLocation(location, parseSearchParams(searchParams, events), authToken, currentEventNames),
    await getGuestsByLocation(location, { type: eventType }, authToken, currentEventNames, 1, 1),
    await getTopicsByLocation(location, eventType),
    await getGuestEvents(location, authToken),
  ]);

  return {
    ...eventInfo,
    topics,
    currentGuest: currentGuestResponse?.guests[0]?.memberUid === userInfo?.uid ? currentGuestResponse?.guests[0] : null,
    isUserGoing: currentGuestResponse?.guests[0]?.memberUid === userInfo?.uid,
    eventsForFilter: getFilteredEventsForUser(loggedInUserEvents, events, isLoggedIn, userInfo),
  };
}

export function useEventDetails(queryParams: QueryParams, initialData: IGuestDetails) {
  return useQuery({
    queryKey: [IrlQueryKeys.GET_EVENT_DETAILS, queryParams.location, queryParams.eventType],
    queryFn: () => fetcher(queryParams),
    initialData,
  });
}
