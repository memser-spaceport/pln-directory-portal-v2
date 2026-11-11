/*
 * `GET /v1/members/:uid/events` and `GET /v1/teams/:uid/events` (BE LAB-3215, LAB-3211).
 *
 * The one place these shapes live on the frontend. They mirror the BE contract schemas in
 * `libs/contracts/src/schema/profile-events.ts` (`ResponseMemberEventsSchema`, `ResponseTeamEventsSchema`), so a
 * contract change is a change to this file and to `normalizeMemberEvents` / `normalizeTeamEvents` only.
 */

/** A role that isn't plain attendance. Plain attendance is an empty `roles` array. */
export type ProfileEventRole = 'Host' | 'Speaker' | 'Sponsor';

/** A face on a card: one going member. */
export interface ProfileEventPerson {
  uid: string;
  name: string;
  image: string | null;
}

/** The event fields every event card carries. */
export interface ProfileEventFields {
  kind: 'event';
  uid: string;
  name: string;
  type: string | null;
  /** ISO timestamps. Cards draw them in UTC, as Home's rail does. */
  startDate: string;
  endDate: string;
  logo: string | null;
  locationUid: string | null;
  /** The gathering's name, e.g. "Berlin, Germany". */
  location: string | null;
  /** `location` up to its first comma ("Berlin"), applied by the BE (design D10). */
  city: string | null;
  roles: ProfileEventRole[];
  /** Distinct members going, as the drawer's "N People going" counts them. */
  goingCount: number;
  /** Up to three of them. */
  faces: ProfileEventPerson[];
  /** The viewer is going too. Always false for a signed-out viewer. */
  viewerGoing: boolean;
}

/** One of a member's events. */
export interface MemberProfileEvent extends ProfileEventFields {
  /** False only on the owner's own view of an event they hid; other viewers never get hidden events. */
  showOnProfile: boolean;
}

/** A team's upcoming event: its current members going, plus the team's own roles in `roles`. */
export interface TeamProfileEvent extends ProfileEventFields {
  memberCount: number;
  members: ProfileEventPerson[];
}

/** A past event the team hosted, co-hosted, spoke at or sponsored. */
export type TeamPastEvent = ProfileEventFields;

/** A Demo Day the team took part in; first among the team's past items. */
export interface TeamProfileDemoDay {
  kind: 'demo-day';
  uid: string;
  title: string;
  slug: string;
  startDate: string;
  endDate: string;
}

/** One group (upcoming or past), paged. `total` counts every visible item, for "Show all N". */
export interface ProfileEventsGroup<T> {
  page: number;
  limit: number;
  total: number;
  items: T[];
}

export interface MemberEventsResponse {
  upcoming?: ProfileEventsGroup<MemberProfileEvent>;
  past?: ProfileEventsGroup<MemberProfileEvent>;
}

export interface TeamEventsResponse {
  upcoming?: ProfileEventsGroup<TeamProfileEvent>;
  past?: ProfileEventsGroup<TeamProfileDemoDay | TeamPastEvent>;
}

export type ProfileEventsGroupName = 'upcoming' | 'past';

export interface ProfileEventsQuery {
  /** Only this group, paged. Without it the BE returns both groups. */
  group?: ProfileEventsGroupName;
  page?: number;
  /** BE default 4, max 50. */
  limit?: number;
}
