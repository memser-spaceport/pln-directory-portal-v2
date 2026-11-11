import type { EventGoingNotice } from './EventDrawerView';

/** The D8 toast copy a host shows from `onGoing`. */
export function eventGoingToastText({ eventName, showOnProfile }: EventGoingNotice): string {
  return showOnProfile ? `${eventName} is on your profile.` : `You're going to ${eventName}.`;
}
