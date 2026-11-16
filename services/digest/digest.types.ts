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
};

/** `expired`: a 90-day-old link. `invalid`: missing, changed or wrongly signed. `unavailable`: anything else. */
export type DigestPageError = 'expired' | 'invalid' | 'unavailable';

export type DigestPageResult = { data: DigestPageData; error?: never } | { data?: never; error: DigestPageError };

export type DigestChoiceResponse = { newsItemUid: string; choice: DigestChoice | null; changed: boolean };
