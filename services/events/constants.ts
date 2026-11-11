export enum EventsQueryKeys {
  GET_UPCOMING_EVENTS = 'GET_UPCOMING_EVENTS',
  /** One event for the event drawer: `[EVENT_DETAIL, eventUid, viewerUid]`. */
  EVENT_DETAIL = 'EVENT_DETAIL',
  /** The strict attendee list of one event: `[EVENT_ATTENDEES, eventUid, search]`. */
  EVENT_ATTENDEES = 'EVENT_ATTENDEES',
  /** The viewer's own guest rows at one gathering: `[MY_GATHERING_PLANS, locationUid, viewerUid]`. */
  MY_GATHERING_PLANS = 'MY_GATHERING_PLANS',
  /** A member profile's events (LAB-3215 endpoint; hook lands with LAB-3217): `[MEMBER_EVENTS, memberUid, viewerUid]`. */
  MEMBER_EVENTS = 'MEMBER_EVENTS',
  /** A team profile's events (LAB-3215 endpoint; hook lands with LAB-3219): `[TEAM_EVENTS, teamUid, viewerUid]`. */
  TEAM_EVENTS = 'TEAM_EVENTS',
}
