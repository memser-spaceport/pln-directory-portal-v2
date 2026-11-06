/** One open role on Home's rail, flattened from the job board's team groups (`GET /v1/job-openings`). */
export interface IHomeRole {
  uid: string;
  title: string;
  /** The role's locations joined with ", "; empty when the posting names none. */
  location: string;
  applyUrl: string | null;
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
}

/** The rail's roles section: the newest roles and the board's total (`totalRoles`). */
export interface IHomeRoles {
  roles: IHomeRole[];
  total: number;
}

/** One event on Home's rail, from `GET /v1/irl/events/upcoming`. */
export interface IHomeEvent {
  uid: string;
  name: string;
  /** ISO date-time of the first day. */
  startDate: string;
  /** ISO date-time of the last day. */
  endDate: string;
  location: string;
}

/** The rail's events section: up to three events and the total for "See all". */
export interface IHomeEvents {
  events: IHomeEvent[];
  total: number;
}
