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
   * plan for it. Coverage was the open question and it is answered: 83 of 92
   * roles on dev carry one, and the rest fall back to the posting link.
   */
  descriptionHtml?: string | null;
  lastUpdated: string;
  postedDate: string | null;
  detectionDate: string | null;
  /**
   * How many members have signalled interest in this role. Nothing renders it —
   * the banner says the team will be notified, not how many others got there
   * first — but it is on the wire, so it is typed.
   */
  interestedCount?: number;
  /**
   * Whether THIS viewer has signalled interest.
   *
   * **Still do not read this**, though the reason has changed. The token is now
   * threaded through `/api/jobs/list` and `getJobsList` (it had to be, for
   * `IJobTeam.viewerIsInterestedInTeam` below), so the field is no longer
   * structurally false — but nothing has verified it against the per-role
   * banner, which reads `GET /v1/job-openings/interests` via `useJobInterests`.
   *
   * Two sources for one answer is how they drift. If this field is to become
   * the banner's source, retire that query in the same change rather than
   * letting both run.
   */
  viewerIsInterested?: boolean;
}

export interface IJobTeam {
  uid: string;
  name: string;
  logoUrl: string | null;
  focusAreas: string[];
  subFocusAreas: string[];
  /** Team-configured inbox for job referrals. When set, the Refer modal skips member pick. */
  jobReferEmail?: string | null;
  /** False when the backend refuses in-app applications for this team (e.g. inactive lead emails); Apply then leaves the site. */
  inAppApplyAvailable?: boolean;
  /**
   * Whether THIS viewer has signalled interest in the team itself — the
   * open-role signal, sent when nothing on the card fits.
   *
   * Unlike `IJobRole.viewerIsInterested` above, this one **is** readable: the
   * board's proxy route now forwards the member's token (see
   * `app/api/jobs/list/route.ts`), and the list endpoint resolves the viewer
   * when one arrives. It is still `false` for an anonymous request, which is
   * correct rather than misleading — a signed-out visitor has signalled nothing.
   */
  viewerIsInterestedInTeam?: boolean;
  /** How many members have signalled interest in the team. On the wire, and
   *  deliberately not rendered — the row says "we'll be in touch", not "you and
   *  eleven others". Typed so it is documented rather than rediscovered. */
  interestedInTeamCount?: number;
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

/** The person being referred when they have no directory record. Mirrors the backend's
 *  `ReferredExternalPersonSchema` — all three required, because together they are the
 *  whole record: the name is who the note is about, the email is how the hiring team
 *  reaches them, and the LinkedIn profile is the only way a reader can check who they
 *  are (the job a member's directory page does for a member). */
export interface IJobReferralExternalPerson {
  name: string;
  email: string;
  /** As typed — a bare slug or a URL. The backend normalises it
   *  (`normalizeExternalLinkedinUrl`); the frontend only validates the shape. */
  linkedinUrl: string;
}

/** Exactly one of the two, mirroring `CreateJobReferralSchema`'s refine. That refine
 *  rejects both-or-neither with a 400, so the `never` arms turn a wrong payload into a
 *  type error instead of a toast. */
type IJobReferralReferee =
  | { referredMemberUid: string; referredPerson?: never }
  | { referredPerson: IJobReferralExternalPerson; referredMemberUid?: never };

export type ICreateJobReferralPayload = IJobReferralReferee & {
  /** Omitted entirely when the hiring team has a referral inbox — the backend addresses it. */
  recipients?: IJobReferralRecipient[];
  note: string;
  /**
   * Whether the referred person is copied on the referral email.
   *
   * Honoured by the backend, which defaults it to `true`. Unchecked, they are left off
   * the CC and receive a separate "you were referred" notice instead — so the choice is
   * which email they get, not whether they hear about it.
   */
  includeReferredMember?: boolean;
};

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
