import type { EventGoingNotice } from './EventDrawerView';

/** The D8 toast copy a host shows from `onGoing`. Going is always on the profile (LAB-3234). */
export function eventGoingToastText({ eventName }: EventGoingNotice): string {
  return `${eventName} is on your profile.`;
}
