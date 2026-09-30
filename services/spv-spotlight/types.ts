/**
 * The frontend's side of the SPV Spotlight contract (LAB-2670). The backend
 * does not exist yet: these shapes are what the page needs, and they are
 * served by `spv-spotlight.mock.ts` until the endpoints land. Treat any change
 * here as a contract change and tell the backend.
 *
 *   GET  /v1/spv-spotlights/:slug                  → SpvSpotlight (auth optional)
 *   POST /v1/spv-spotlights/:slug/access-requests  → SpvAccessRequestResult (auth optional)
 *        409 { reason: SpvAccessRequestBlockReason }
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
  /** `contain` for images whose edges carry content (charts, labelled figures). Defaults to `cover`. */
  fit?: 'cover' | 'contain';
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
