/**
 * The SPV Spotlight contract (LAB-2670), as the directory web API implements
 * it. Treat any change here as a contract change and tell the backend.
 *
 *   GET  /v1/spv-spotlights/:slug                  → SpvSpotlight (auth optional)
 *        404 unknown slug. DRAFT and CLOSED are still 200.
 *   POST /v1/spv-spotlights/:slug/access-requests  → 201 SpvAccessRequestResult (auth optional)
 *        409 { reason: SpvAccessRequestBlockReason }
 *        409 { message: 'This spotlight is closed' } (no reason)
 *        422 { message: 'Input validation failed: …' }
 *
 * An invalid or expired token never 401s: the API reads it as signed out.
 * Signed in, the API takes the email from the token and ignores the body's.
 */

export type SpvSpotlightStatus = 'DRAFT' | 'OPEN' | 'CLOSED';

/**
 * Where the viewer stands with this spotlight, computed by the backend.
 * Signed-out viewers are always NONE. An investor pre-approved by CSV upload
 * is APPROVED as soon as they sign in; the frontend has no CSV logic.
 */
export type SpvViewerAccess = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type SpvMedia = {
  url: string;
  alt: string;
  /** `contain` for images whose edges carry content (charts, labelled figures). The API always sends it. */
  fit: 'cover' | 'contain';
};

export type SpvFounder = {
  uid: string;
  name: string;
  imageUrl: string | null;
  role: string | null;
};

export type SpvTeam = {
  uid: string;
  name: string;
  logoUrl: string | null;
  shortDescription: string;
  /** The directory's About, as HTML. Shown in full when the viewer expands it. */
  longDescription: string | null;
  /** Admin-written short summary for the card; falls back to the one-liner. */
  summary: string | null;
  website: string | null;
  location: string | null;
  /** The directory's size band, e.g. "2–10". */
  teamSize: string | null;
  fundingStage: string | null;
  tags: string[];
  founders: SpvFounder[];
};

export type SpvSpotlight = {
  uid: string;
  slug: string;
  status: SpvSpotlightStatus;
  title: string;
  /** Admin-configured hero copy, as HTML. */
  description: string;
  supportEmail: string;
  /** Only sent when the viewer is APPROVED and the spotlight is OPEN; null otherwise. */
  docSendUrl: string | null;
  team: SpvTeam;
  /** Admin-configured images from the team's website, for the card's carousel. */
  media: SpvMedia[];
  viewerAccess: SpvViewerAccess;
};

export type SpvAccessRequestPayload = {
  email: string;
  name: string;
  role: string;
  organization: string;
  isAccreditedInvestor: true;
};

export type SpvAccessRequestResult = {
  memberUid: string;
  /** True when the request created the account (requesting access is signing up). */
  isNewMember: boolean;
};

/**
 * Why the backend refused to create a request (HTTP 409). Every reason sends a
 * signed-out requester to sign in: the modal never says "rejected" to someone
 * who only typed an email.
 */
export type SpvAccessRequestBlockReason = 'ALREADY_APPLIED' | 'REJECTED' | 'PRE_APPROVED';

export class SpvAccessRequestBlockedError extends Error {
  readonly reason: SpvAccessRequestBlockReason;

  constructor(reason: SpvAccessRequestBlockReason) {
    super(`Access request blocked: ${reason}`);
    this.name = 'SpvAccessRequestBlockedError';
    this.reason = reason;
  }
}

/** HTTP 409 without a reason: the spotlight closed while the form was open. */
export class SpvSpotlightClosedError extends Error {
  constructor() {
    super('This spotlight is closed');
    this.name = 'SpvSpotlightClosedError';
  }
}

/** HTTP 422: the backend's own validation message, shown inline in the form. */
export class SpvAccessRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpvAccessRequestValidationError';
  }
}
