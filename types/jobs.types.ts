export interface IJobRole {
  uid: string;
  roleTitle: string;
  roleCategory: string | null;
  seniority: string | null;
  location: string[];
  workMode: string | null;
  applyUrl: string | null;
  /**
   * The posting's own body, scraped by the ingest. Null when the source had
   * none — which is most roles, because the ingest only carries a body for the
   * teams whose careers sites it can read.
   *
   * Sanitized on the way in, and sanitized again on the way out
   * (`sanitizeJobDescriptionHtml`): this app ships no CSP, so that allowlist is
   * the only defense layer, and this is third-party markup.
   *
   * One blob, not a structure. It is NOT the sectioned body the job-board
   * prototype draws (responsibilities, requirements, compensation, hiring
   * process) — none of that exists anywhere in this system, and there is no
   * plan for it. See `SHOW_JOB_DETAIL`, which flips on coverage of this field.
   */
  descriptionHtml?: string | null;
  lastUpdated: string;
  postedDate: string | null;
  detectionDate: string | null;
}

export interface IJobTeam {
  uid: string;
  name: string;
  logoUrl: string | null;
  focusAreas: string[];
  subFocusAreas: string[];
  /** Team-configured inbox for job referrals. When set, the Refer modal skips member pick. */
  jobReferEmail?: string | null;
}

export interface IJobTeamGroup {
  team: IJobTeam;
  totalRoles: number;
  roles: IJobRole[];
}

export interface IJobsListResponse {
  groups: IJobTeamGroup[];
  page: number;
  limit: number;
  total: number;
  totalGroups: number;
  totalRoles: number;
}

export interface IJobsFacetItem {
  value: string;
  count: number;
}

export interface IJobsFacetTreeItem extends IJobsFacetItem {
  children: IJobsFacetItem[];
}

export interface IJobsFiltersResponse {
  roleCategory: IJobsFacetItem[];
  seniority: IJobsFacetItem[];
  focus: IJobsFacetTreeItem[];
  location: IJobsFacetItem[];
  workMode: IJobsFacetItem[];
}

export type JobsSortKey = 'newest' | 'company_az';

export type JobsFilterKey = 'roleCategory' | 'seniority' | 'focus' | 'location' | 'workplaceType';

/** One recipient of a referral email. Mirrors the backend's `JobReferralRecipientSchema`:
 *  either half identifies someone, and at least one must be present. A directory member
 *  is sent as `memberUid` (the server resolves their address), a typed address as
 *  `email`. */
export type IJobReferralRecipient = { memberUid: string; name?: string } | { email: string; name?: string };

export interface IJobReferralDraft {
  /** The complete note, ready to show in an editable field. */
  note: string;
  referrerName: string;
  referrerTitle: string | null;
  referrerCompany: string | null;
  referredName: string;
  referredTitle: string | null;
  referredCompany: string | null;
  roleTitle: string;
  teamName: string;
  applyUrl: string | null;
}

export interface IJobReferralResult {
  uid: string;
  jobUid: string;
  /** The address the email was sent to — the first recipient. */
  to: string;
  /** Everyone else, plus the referrer and the referred member. */
  cc: string[];
  sentAt: string;
}
