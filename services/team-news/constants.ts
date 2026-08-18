export enum TeamNewsQueryKeys {
  GROUPED_BY_FOCUS_AREA = 'team-news-grouped-by-focus-area',
  LIST = 'team-news-list',
  FILTERS = 'team-news-filters',
  BY_TEAM = 'team-news-by-team',
  LATEST_AT = 'team-news-latest-at',
  NEWS_COUNTS = 'team-news-counts',
}

/**
 * ONE cache entry per session, filled INCREMENTALLY as each surface asks for the
 * team uids nobody has asked for yet. Deliberately not keyed by the visible uid
 * set: the teams grid and the job board page in more teams as you scroll, and a
 * per-set key would mint a fresh entry on every page and re-request everything
 * already known. Mirrors feedQueryKeys.commentCounts, whose hook this one ports.
 */
export const teamNewsCountsQueryKey = () => ['team-news', TeamNewsQueryKeys.NEWS_COUNTS] as const;

export const TEAM_NEWS_DEFAULT_WINDOW_DAYS = 14;
export const TEAM_NEWS_PREVIEW_LIMIT = 3;
/** Home "Popular this week" rail — matches server trending seed (top 5–7). */
export const TEAM_NEWS_POPULAR_LIMIT = 7;
export const TEAM_NEWS_MODAL_PAGE_SIZE = 20;

/**
 * The "N new posts" chip's window — 30, while the feed's own default is 14
 * (TEAM_NEWS_DEFAULT_WINDOW_DAYS above). The divergence is intentional and
 * mirrored server-side: the chip counts what a team published, the feed decides
 * what it still shows. Kept here only so the two sit next to each other; the
 * server owns the real number.
 */
export const TEAM_NEWS_COUNT_WINDOW_DAYS = 30;

/**
 * The "N new posts" chip on the teams grid and the job board.
 *
 * ON since 2026-08-18, once POST /v1/team-news/counts was verified live on dev.
 * Code-level rather than an env var because this repo has no runtime flag system
 * — see SHOW_HIRING_NEWS in components/page/home/TeamNews/constants.ts, which
 * this follows in shape and in one hard-won rule: gate the WORK, not the render.
 * It is passed to the counts query's `enabled`, so turning it off again stops
 * the request rather than merely hiding its result.
 */
export const SHOW_TEAM_NEWS_COUNT_CHIP = true;
