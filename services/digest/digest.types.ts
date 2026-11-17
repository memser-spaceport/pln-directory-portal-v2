/**
 * The digest page API (LAB-3263, backend `libs/contracts/src/schema/team-news.ts`, `LabosDigestPage*`).
 * The link token is the only credential: it names the member, so the session never matters.
 */
export type DigestChoice = 'more' | 'less';

export type DigestFrequency = 'daily' | 'weekly';

export type DigestImage = {
  width: number;
  height: number;
  variants: Array<{ width: number; url: string }>;
};

/** One outlet that reported a story (LAB-3288). `domain` is null when the URL doesn't parse. */
export type DigestSource = { url: string; domain: string | null };

export type DigestStory = {
  uid: string;
  position: number;
  isTopStory: boolean;
  title: string;
  summary: string | null;
  contentHtml: string | null;
  image: DigestImage | null;
  imageUrl: string | null;
  sourceUrl: string;
  sourceDomain: string | null;
  teamUid: string;
  teamName: string;
  /** Page v2 (LAB-3288): the team header, Sources line and Comments count. */
  teamLogoUrl: string | null;
  /** Whether the link's member follows the team. */
  followsTeam: boolean;
  /** Every source, main first, each once. */
  sources: DigestSource[];
  commentCount: number;
  eventType: string;
  tags: string[];
  choice: DigestChoice | null;
};

export type DigestForumPost = {
  tid: number;
  title: string;
  authorName: string;
  authorRole: string | null;
  authorTeam: string | null;
  authorAvatarUrl: string | null;
  contentHtml: string;
  url: string;
};

export type DigestPageData = {
  frequency: DigestFrequency;
  sentAt: string;
  firstName: string | null;
  stories: DigestStory[];
  forumPosts: DigestForumPost[];
  forumUnavailable: boolean;
  /** Whether the link's member is on a team now: shows "Got news from your team?". */
  isTeamMember: boolean;
  /** When the next digest of this frequency goes out, ISO 8601. */
  nextSendAt: string | null;
  /** The link member's topics (LAB-3289): followed tags, and the ones to suggest, by interest weight. */
  topics: DigestTopics;
  /** The member's latest issues, newest first, at most 8, the link's own among them (LAB-3294). */
  issues: DigestIssue[];
  /** More from the network (LAB-3291): other press about network teams in the issue's week, at most 5. */
  networkNews: DigestNetworkNews[];
  /** Upcoming events (LAB-3292): the next 4 weeks, soonest first, at most 5, and the window's total. */
  events: { items: DigestEvent[]; total: number };
};

/** One row of Upcoming events (LAB-3292). */
export type DigestEvent = {
  uid: string;
  name: string;
  startDate: string;
  endDate: string;
  /** "Lisbon, Portugal"; null when the gathering has none. */
  location: string | null;
  locationUid: string | null;
  externalId: string | null;
  logoUrl: string | null;
  /** IN_PERSON, VIRTUAL or INVITE_ONLY. */
  type: string | null;
  /** Members going; null when the event hides it (invite-only). */
  goingCount: number | null;
};

/** One row of More from the network (LAB-3291). Opens `url` at the outlet. */
export type DigestNetworkNews = {
  uid: string;
  title: string;
  url: string;
  /** The outlet, as the source's domain. */
  domain: string | null;
  image: DigestImage | null;
  imageUrl: string | null;
  eventDate: string;
  teamName: string;
};

/** One row of Past issues (LAB-3294). `sentAt` is also the issue's key in the address (`?issue=`). */
export type DigestIssue = {
  sentAt: string;
  frequency: DigestFrequency;
  /** The issue's top story title, else its first story's; null when that story is gone. */
  title: string | null;
  /** The link's own issue: opened without `issue`. */
  isLinkIssue: boolean;
};

export type DigestTopic = { slug: string; title: string };

export type DigestTopics = { followed: DigestTopic[]; suggested: DigestTopic[] };

/** `expired`: a 90-day-old link. `invalid`: missing, changed or wrongly signed. `unavailable`: anything else. */
export type DigestPageError = 'expired' | 'invalid' | 'unavailable';

export type DigestPageResult = { data: DigestPageData; error?: never } | { data?: never; error: DigestPageError };

export type DigestChoiceResponse = { newsItemUid: string; choice: DigestChoice | null; changed: boolean };
