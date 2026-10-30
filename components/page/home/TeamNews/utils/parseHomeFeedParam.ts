import { HOME_FEED_FOR_YOU, type HomeFeedParam } from '../constants';

/** Home's `?feed=` (LAB-3036): only `for-you` is known; anything else is ignored. */
export function parseHomeFeedParam(value: string | string[] | undefined): HomeFeedParam | undefined {
  return value === HOME_FEED_FOR_YOU ? HOME_FEED_FOR_YOU : undefined;
}
