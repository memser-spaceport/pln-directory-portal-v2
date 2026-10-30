export type TeamNewsEventType =
  | 'FUNDING'
  | 'LAUNCH'
  | 'PARTNERSHIP'
  | 'ANNOUNCEMENT'
  | 'MILESTONE'
  | 'OTHER'
  | 'DEALS'
  | 'HIRING';

export interface ITeamNewsDiscussion {
  count: number;
  latestTopicUrl: string | null;
}

export interface ITeamNewsItem {
  uid: string;
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
  eventType: TeamNewsEventType;
  eventDate: string;
  title: string;
  summary: string | null;
  /** Rich HTML body for the detail modal (2–5 paragraphs, e.g. `<p>…</p>`).
   *  For not-yet-re-enriched items the API falls back to `<p>{summary}</p>`.
   *  Enrichment-pipeline output — must be sanitized before rendering (see
   *  NewsDetailModal). `summary` stays the plain-text teaser for cards. */
  contentHtml?: string;
  sourceUrl: string;
  sourceDomain: string | null;
  /** Article URLs of every outlet that covered this story, primary first —
   *  `sourceUrls[0]` is expected to equal `sourceUrl` (the card click always
   *  trusts `sourceUrl`). Absent or length ≤ 1 means single-source (render
   *  `sourceDomain` as before). Rendered in API order; display domains are
   *  derived from the URLs client-side (see getNewsSources). Not sent by the
   *  API yet; the UI lights up automatically once it is. */
  sourceUrls?: string[];
  tags: string[];
  focusAreas: string[];
  subFocusAreas: string[];
  createdAt: string;
  discussion: ITeamNewsDiscussion;
  isFollowed?: boolean;
  viewerHasUpvoted?: boolean;
  upvoteCount?: number;
  /** 1 = Top Stories lead, 2–3 = runners-up; null/absent when not featured. */
  editorialRank?: number | null;
  /** Raw feed-card impression count, not deduplicated by user/session/repeat
   *  viewing. Incremented via POST /v1/team-news/impressions. */
  viewCount?: number;
  /** True when posted from the team profile by a member or directory admin. */
  isTeamPosted?: boolean;
}

/** Returned by POST/DELETE /v1/team-news/:uid/upvote and carried on every news item. */
export interface ITeamNewsUpvoteStatus {
  upvoteCount: number;
  viewerHasUpvoted: boolean;
}

// Shape returned by GET /v1/team-news/follow-suggestions — `reason` is a
// pre-formatted display string (e.g. "Storage · 1.2k followers"); the UI strips
// the trailing follower-count segment before display. The backend does not
// expose the underlying reason kind.
export interface ISuggestedTeam {
  uid: string;
  name: string;
  logo: string | null;
  reason: string;
  shortDescription?: string | null;
}

export interface ITeamNewsFollowSuggestionsResponse {
  items: ISuggestedTeam[];
}

// Trimmed item shape returned by GET /v1/team-news/popular — distinct from
// ITeamNewsItem (no eventDate/summary/discussion), so it has its own type.
export interface ITeamNewsPopularItem {
  uid: string;
  title: string;
  teamUid: string;
  teamName: string;
  sourceUrl: string;
  upvoteCount: number;
}

/** A "Try asking" prompt on the AI Search new-chat page, built from one news story (LAB-3012). */
export interface ITeamNewsPrompt {
  /** The news item's uid. */
  uid: string;
  /** The text shown on the prompt and asked to AI Search when the member picks it. */
  question: string;
}

export interface ITeamNewsPopularResponse {
  items: ITeamNewsPopularItem[];
}

export interface ICreateTeamNewsDiscussionRequest {
  forumTopicId: number;
  forumTopicSlug: string;
  forumTopicUrl: string;
}

export interface ITeamNewsForumLink {
  uid: string;
  newsItemUid: string;
  forumTopicId: number;
  forumTopicSlug: string;
  forumTopicUrl: string;
  createdByUid: string | null;
  createdAt: string;
}

export interface ICreateTeamNewsDiscussionResponse {
  link: ITeamNewsForumLink;
  created: boolean;
}

export interface ITeamNewsFocusArea {
  uid: string;
  title: string;
}

export interface ITeamNewsGroup {
  focusArea: ITeamNewsFocusArea;
  total: number;
  items: ITeamNewsItem[];
}

export interface ITeamNewsGroupedResponse {
  windowDays: number;
  generatedAt: string;
  groups: ITeamNewsGroup[];
  /** Teams with no focus-area group; merged into the home "All" tab only. */
  allTabExtraItems?: ITeamNewsItem[];
  /** Memberships ∪ follows ∪ Teams-to-follow matches; empty for anonymous. */
  forYouTeamUids?: string[];
  /** The viewer's news tags, parents expanded to children (LAB-2999); empty for anonymous. */
  forYouTags?: string[];
  /** Memberships ∪ follows, without the related teams (LAB-2999); empty for anonymous. */
  forYouOwnTeamUids?: string[];
}

export interface TeamCluster {
  teamUid: string;
  teamName: string;
  teamLogoUrl: string | null;
  items: ITeamNewsItem[]; // this team's matching stories, any order — NewsGroupCard sorts before rendering
}

export interface ITeamNewsListResponse {
  page: number;
  limit: number;
  total: number;
  items: ITeamNewsItem[];
}

export interface ITeamNewsByTeamResponse {
  teamUid: string;
  teamName: string;
  page: number;
  limit: number;
  total: number;
  items: ITeamNewsItem[];
}

export interface ITeamNewsFiltersResponse {
  eventType: Array<{ value: string; count: number }>;
  focus: Array<{ value: string; count: number }>;
}

/**
 * POST /v1/team-news/counts — recent post counts keyed by team uid.
 * A uid ABSENT from the map means zero, not "unknown to the server": groupBy
 * returns no row for a team with nothing recent. Both render as no chip.
 */
export type ITeamNewsCountsResponse = Record<string, number>;

/** One row of `GET /v1/focus-areas` (no `type`): every focus area, flat, with its parent. */
export interface INewsFocusArea {
  uid: string;
  title: string;
  parentUid: string | null;
}

/** A news tag a member can choose: a focus area, by slug (LAB-2998). */
export interface INewsTag {
  slug: string;
  title: string;
}

/** A top-level focus area with the second-level ones news used under it (`GET /v1/team-news/tags`). */
export interface INewsTagGroup extends INewsTag {
  children: INewsTag[];
}
