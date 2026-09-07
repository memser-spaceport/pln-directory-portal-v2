import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';

import { getMyLocationSubscriptions } from '@/services/irl.service';
import { getParsedValue } from '@/utils/common.utils';
import { IrlQueryKeys } from '@/services/irl/constants';
import type { IMyLocationSubscriptions } from '@/hooks/irl/use-location-follow-state';

const LOGGED_OUT: IMyLocationSubscriptions = { subscriptions: [], isUnavailable: false };

/**
 * The viewer's own IRL location subscriptions.
 *
 * One request covers every location card on the page: the subscribers embedded
 * in a featured/location payload are the public, approval-filtered list and
 * cannot say whether *this* viewer follows a location.
 *
 * A logged-out viewer follows nothing, so that answer is returned without a
 * request — and as `isUnavailable: false`, since it is a real answer rather
 * than a failed read.
 */
export function useMyLocationSubscriptions(isLoggedIn: boolean) {
  const { data } = useQuery<IMyLocationSubscriptions>({
    queryKey: [IrlQueryKeys.MY_LOCATION_SUBSCRIPTIONS],
    queryFn: () => getMyLocationSubscriptions(getParsedValue(Cookies.get('authToken'))),
    enabled: Boolean(isLoggedIn),
    staleTime: 0,
  });

  if (!isLoggedIn) {
    return LOGGED_OUT;
  }
  /* Until the first response lands, say so rather than claiming the viewer
     follows nothing — callers fall back to the public list on `isUnavailable`. */
  return data ?? { subscriptions: [], isUnavailable: true };
}
