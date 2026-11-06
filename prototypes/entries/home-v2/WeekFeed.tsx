'use client';

import clsx from 'clsx';
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';

import { SortDropdown } from '@/components/common/filters/SortDropdown';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { NewsSearch } from '@/components/page/home/TeamNews/components/NewsSearch';
import type { ITeamNewsItem } from '@/types/team-news.types';
import { SORT_OPTIONS, type TeamNewsSort } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';

// Production's filter bar under the Home news tabs: pill row, mobile "Type:"
// dropdown, "Sort by:" dropdown — classes imported, markup transcribed from
// TeamNews.tsx (the `.filterBar` block).
import tn from '@/components/page/home/TeamNews/TeamNews.module.scss';
// Production Home's description line under "Network updates" (NewsBase `.sub`).
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';

import { WEEK_ROWS, type WeekRow } from '../home-refactor-b/mocks';
// The Job Board "See all N …" expander: the same brand text every rail ends in.
import jobsCss from '@/components/page/jobs/TeamGroupCard/TeamGroupCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import hr from '../home-refactor/HomeRefactorPrototype.module.scss';
import { FOR_YOU_UIDS } from './mocks';
import nf from '../newsfeed/Newsfeed.module.scss';
import { FollowButton } from '../follow-shared/FollowButton';
import sortCss from '@/components/common/filters/SortDropdown/SortDropdown.module.scss';
import { EVENT_TYPE_LABEL } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';
import local from './HomeV2Prototype.module.scss';

/** Production's category ids: 'all', 'forYou', 'top', 'discussions', or an event type. */
type Cat = string;

const ALL_CAT = 'all';
const FOR_YOU_CAT = 'forYou';
const DISCUSSIONS_CAT = 'discussions';
const TOP_CAT = 'top';

/* Event types left off the pill row: Milestone, Partnership and Other drew 1, 4 and 3 people in 90 days,
   and Other is the catch-all for uncategorised posts, which nobody filters by. Their posts stay under All
   and keep their label on the card. */
const ROW_HIDDEN_TYPES = new Set(['MILESTONE', 'PARTNERSHIP', 'OTHER']);

/* One stream, news and forum together. The All · News · Forum tabs came off at the 2026-11-02
   standup: forum posts already sit in production's news stream for members who have the forum,
   Discussions filters them, and a Forum tab means nothing to a member without forum access. */
const ROWS: WeekRow[] = [...WEEK_ROWS.news, ...WEEK_ROWS.forum];

/* Production's search (matchesTeamNewsQuery: team, title, summary, tags), plus the one change the
   standup asked for: a leading "#" is dropped, so "#ai" finds the stories tagged ai. Production
   already matches tags, but no tag contains "#", so a hashtag query found nothing. */
const normalizeQuery = (q: string) => q.trim().toLowerCase().replace(/^#+/, '');

const uidOf = (row: WeekRow) => (row.newsUid ?? row.forumUid)!;

export interface WeekFeedProps {
  /** The full news card for one story (newsfeed-v0's V0FeedCard), its hashtags wired to the pill row. */
  renderNews: (
    story: ITeamNewsItem,
    topic: { onSelectTopic: (tag: string) => void; activeTopic?: string[] },
    /** One of the week's editorial picks: the card carries the "Top story" label. */
    isTop: boolean,
  ) => ReactNode;
  /** The full forum card for one thread (newsfeed-v0's ForumPostCard), its hashtags wired the same way. */
  renderForum: (uid: string, topic: { onSelectTopic: (tag: string) => void; activeTopic?: string[] }) => ReactNode;
  /** A thread's hashtags (newsfeed-v0's forum mocks). */
  forumTagsFor: (uid: string) => string[];
  /** Story with this week's date (home-refactor-b's weekNewsItem). */
  storyFor: (uid: string) => ITeamNewsItem;
  likeCount: (uid: string) => number;
  followedTeams: Set<string>;
  /** Present = a link in the header naming the section under the feed. */
  jumpTo?: { href: string; label: string };
  /** The rail beside the feed: the cut lands where it ends, so the feed reaches the band below. */
  fillTo?: RefObject<HTMLElement | null>;
  /** The week's editorial picks. Not pinned in a band (2026-10-30): they stay in the stream, labelled
   *  "Top story", and the Top pill lists just them. */
  topStoryUids?: string[];
  /** Where "See all news" goes (home-v2's news-only page); falls back to the newsfeed prototype. */
  newsHref?: string;
}

/** The fewest full cards before the cut; beside a longer rail the feed shows more. */
const FEED_CAP = 3;
/** How much of the first card past the cut shows under the fade. */
const CUT_PEEK = 140;
/** The rail sits beside the feed from tablet-landscape (newsRow's breakpoint); below that it stacks under it. */
const SIDE_BY_SIDE = '(min-width: 960px)';


const DownArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 3v10M4 9l4 4 4-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * "Network Updates", in full: one stream of news and forum threads by recency,
 * over the feed's own full cards, with production Home's filter bar under the
 * title. No tabs (2026-11-02, see ROWS). No card around it: the cards stand on
 * the page ground the way production Home's news section does, so nothing is a
 * card inside a card.
 *
 * Top stories are not a pinned band (2026-10-30, confirmed 2026-11-02): the
 * picks stay in the stream with a "Top story" label, at ordinary card sizes, and
 * a Top pill lists them, so Home doesn't open on the same three for two weeks.
 *
 * Filter rules are production's: For You first, empty categories dropped, a
 * count on every pill but All, forum posts under Discussions. The row is trimmed
 * to For You · All · Top · Discussions · Funding · Launch · Announcement (the
 * pills people click; see ROW_HIDDEN_TYPES); "All categories" is "All", and
 * pressing the active pill again resets to it.
 *
 * Search is production's header search, with "#tag" queries matching tags
 * (see normalizeQuery).
 *
 * Hashtags stay on the stories, in the newsfeed's style (TopicTags' blue `#tag`
 * links, values in production's tag vocabulary). A click scopes the feed the
 * newsfeed's way, and clicks stack (2026-11-03): each tag clicked joins the scope
 * row under the pills ("Filter: #a ✕ #b ✕ · N updates · Clear all · Narrow by
 * + #c"), and a story must carry every selected tag.
 */
export function WeekFeed({
  renderNews,
  renderForum,
  forumTagsFor,
  storyFor,
  likeCount,
  followedTeams,
  jumpTo,
  fillTo,
  topStoryUids = [],
  newsHref,
}: WeekFeedProps) {
  const [cat, setCat] = useState<Cat>(ALL_CAT);
  const [sort, setSort] = useState<TeamNewsSort>('latest');
  /* Selected hashtags, in the order they were added. A story must carry all of them. */
  const [topics, setTopics] = useState<string[]>([]);
  const toggleTopic = (tag: string) =>
    setTopics((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  const [followedTopics, setFollowedTopics] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const matches = (row: WeekRow, c: Cat): boolean => {
    if (c === ALL_CAT) return true;
    if (c === FOR_YOU_CAT) return FOR_YOU_UIDS.includes(uidOf(row));
    if (c === DISCUSSIONS_CAT) return Boolean(row.forumUid);
    if (c === TOP_CAT) return Boolean(row.newsUid) && topStoryUids.includes(row.newsUid!);
    return Boolean(row.newsUid) && storyFor(row.newsUid!).eventType === c;
  };

  /* Hashtags clicked on stories or threads narrow to everything carrying ALL of them
     (the newsfeed's exact topic filter, stacked), news and forum alike. AND, not OR:
     a tag added from a card on screen always keeps that card, so a narrowing step
     never empties the feed. */
  const tagsOf = (r: WeekRow) => (r.newsUid ? storyFor(r.newsUid).tags : forumTagsFor(r.forumUid!));
  const hasTopic = (r: WeekRow) => topics.every((t) => tagsOf(r).includes(t));

  /* The search narrows on top of the pill and the hashtag, as production's does. */
  const q = normalizeQuery(query);
  const hasQuery = (r: WeekRow) => {
    if (!q) return true;
    const summary = r.newsUid ? (storyFor(r.newsUid).summary ?? '') : '';
    return (
      r.title.toLowerCase().includes(q) ||
      r.source.name.toLowerCase().includes(q) ||
      summary.toLowerCase().includes(q) ||
      tagsOf(r).some((t) => t.toLowerCase().includes(q))
    );
  };

  /* Counts follow the hashtag and the search too, and a pill that drops to 0 is hidden, not greyed. */
  const pills = useMemo(() => {
    const count = (c: Cat) => ROWS.filter((r) => matches(r, c) && hasTopic(r) && hasQuery(r)).length;
    const list: { id: Cat; label: string }[] = [
      { id: FOR_YOU_CAT, label: 'For You' },
      { id: ALL_CAT, label: 'All' },
      /* Top: the week's editorial picks, which stay in the stream instead of a pinned band. */
      { id: TOP_CAT, label: 'Top' },
      /* Discussions straight after All and Top: the pill people come back to. */
      { id: DISCUSSIONS_CAT, label: 'Discussions' },
      ...(Object.keys(EVENT_TYPE_LABEL) as (keyof typeof EVENT_TYPE_LABEL)[])
        .filter((id) => !ROW_HIDDEN_TYPES.has(id))
        .map((id) => ({ id: id as Cat, label: EVENT_TYPE_LABEL[id] })),
    ];
    return list.map((p) => ({ ...p, count: count(p.id) })).filter((p) => p.id === ALL_CAT || p.count > 0);
    // `matches`/`hasQuery` read storyFor only; topics and q cover the rest.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics, q]);

  const activeCat = pills.some((p) => p.id === cat) ? cat : ALL_CAT;

  const inScope = ROWS.filter(hasTopic);
  const topicCount = topics.length ? inScope.length : 0;
  /* "Narrow by": the commonest other tags on the stories still in scope, only ones that
     would actually narrow (carried by some of them, not all). */
  const relatedTags = useMemo(() => {
    if (!topics.length) return [];
    const freq = new Map<string, number>();
    inScope.forEach((r) => tagsOf(r).forEach((t) => !topics.includes(t) && freq.set(t, (freq.get(t) ?? 0) + 1)));
    return Array.from(freq.entries())
      .filter(([, n]) => n < inScope.length)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([t]) => t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics]);
  /* Both card kinds draw their hashtags as TopicTags' links: a click adds the tag, clicking a selected one removes it. */
  const topicProps = {
    onSelectTopic: toggleTopic,
    activeTopic: topics.length ? topics : undefined,
  };

  const visible = ROWS
    .filter((r) => matches(r, activeCat) && hasTopic(r) && hasQuery(r))
    .sort((a, b) => {
      if (sort === 'popular') return likeCount(uidOf(b)) - likeCount(uidOf(a));
      if (sort === 'following') {
        const f = (r: WeekRow) => (r.newsUid && followedTeams.has(storyFor(r.newsUid).teamUid) ? 0 : 1);
        const d = f(a) - f(b);
        if (d) return d;
      }
      return (a.hoursAgo ?? 0) - (b.hoursAgo ?? 0);
    });

  /* The cut follows the rail: as many full cards as end above the rail's bottom
     (never fewer than FEED_CAP), then the next one fades out where the rail ends,
     so the feed column reaches the band below instead of leaving a gap. Every
     card stays in the DOM at its natural height (clipped by the list), so the
     measurement holds when the rail grows (Events on) or the filter changes. */
  const listRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ full: number; clip?: number }>({ full: FEED_CAP });
  const visibleKey = visible.map(uidOf).join(',');
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const cards = Array.from(list.children) as HTMLElement[];
      const rail = fillTo?.current;
      const besideRail = rail && window.matchMedia(SIDE_BY_SIDE).matches;
      const target = besideRail ? rail.getBoundingClientRect().bottom - list.getBoundingClientRect().top : 0;
      let full = cards.filter((c) => c.offsetTop + c.offsetHeight <= target).length;
      // Beside the rail at least one full card, so the cut lands at the rail's end; stacked, FEED_CAP.
      full = Math.max(full, besideRail ? 1 : FEED_CAP);
      const next =
        full >= cards.length
          ? { full: cards.length }
          : {
              full,
              // Beside the rail the cut is exactly the rail's end (no hole under it),
              // however little of the next card that leaves under the fade; stacked,
              // the next card shows CUT_PEEK of itself.
              clip: Math.round(
                besideRail ? Math.max(target, cards[full].offsetTop + 24) : cards[full].offsetTop + CUT_PEEK,
              ),
            };
      // The list observes its own size, which the clip changes: only re-render on a real change.
      setFit((prev) => (prev.full === next.full && prev.clip === next.clip ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    if (fillTo?.current) ro.observe(fillTo.current);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [fillTo, visibleKey]);
  const cut = visible.length > fit.full;
  const seeAll = { href: newsHref ?? '/prototypes/newsfeed', label: 'See all news' };

  return (
    <section className={local.weekFeed} aria-labelledby="home-week-title">
      <div className={hr.sectionHead}>
        {/* Production Home's title size (NewsBase `.title`: 24px, 32/42 from 1024px, weight 500). */}
        <h2 id="home-week-title" className={nb.title}>
          Network Updates
        </h2>
        <span className={local.weekHeadActions}>
          {/* Cue variant 'jump': names what sits under the feed, one press away. */}
          {jumpTo && (
            <a href={jumpTo.href} className={clsx(hr.seeAll, local.jumpLink)}>
              {jumpTo.label}
              <DownArrow />
            </a>
          )}
          {/* Production's header search (NewsSearch: the icon opens the field inline; desktop only). */}
          <NewsSearch
            open={searchOpen}
            value={query}
            onOpen={() => setSearchOpen(true)}
            onChange={setQuery}
            onBlur={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node) || query.trim()) return;
              setSearchOpen(false);
            }}
            fieldRef={searchRef}
          />
        </span>
      </div>
      {/* Production Home's line under its news title: NewsBase's copy and `.sub` (14/20, #455468, 720px max). */}
      <p className={clsx(nb.sub, local.weekSub)}>
        Recent shipping, raises, partnerships, and milestones from across the network.
      </p>
      {/* Phones: production's permanent full-width field under the header. */}
      <div className={tn.mobileSearchRow}>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by news, teams…" />
      </div>

      <div className={clsx(tn.filterBar, local.weekFilterBar)}>
        <div className={tn.catRow}>
          {pills.map((p) => (
            <button
              key={p.id}
              type="button"
              className={clsx(tn.cat, p.id === ALL_CAT && local.catAll, { [tn.catActive]: activeCat === p.id })}
              aria-pressed={activeCat === p.id}
              // Pressing the active pill again clears it back to All.
              onClick={() => setCat(activeCat === p.id ? ALL_CAT : p.id)}
            >
              {p.label}
              {p.id !== ALL_CAT && <span>{p.count}</span>}
            </button>
          ))}
        </div>
        <div className={tn.filterActions}>
          <span className={tn.typeMobile}>
            <SortDropdown
              sortByLabel="Type:"
              options={pills.map((p) => ({ value: p.id, label: p.label }))}
              currentSort={activeCat}
              onSortChange={setCat}
            />
          </span>
          <SortDropdown
            sortByLabel="Sort by:"
            options={SORT_OPTIONS}
            currentSort={sort}
            onSortChange={(v) => setSort(v as TeamNewsSort)}
          />
        </div>
      </div>

      {/* Multi-tag scope (2026-11-03): a row of its own under the pills, because several
          chips don't fit beside Sort. Each selected tag is a chip with ✕ (the newsfeed's
          scope chip), the stories must carry all of them, then the count. Follow only for
          a single tag (an intersection can't be followed); Clear all from two tags. The
          "+ #tag" suggestions are the commonest other tags on what's still showing, so
          narrowing further never needs a hunt through the cards. */}
      {topics.length > 0 && (
        <div className={local.tagScope}>
          <span className={sortCss.sortByLabel}>Filter:</span>
          {topics.map((t) => (
            <span key={t} className={clsx(v0.savedView, v0.savedFilterChip, nf.scopeChip)}>
              <span className={clsx(v0.savedViewBody, nf.scopeChipLabel)}>
                <strong>#{t}</strong>
              </span>
              <button
                type="button"
                className={v0.savedViewDelete}
                aria-label={`Stop filtering by #${t}`}
                onClick={() => toggleTopic(t)}
              >
                <svg viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
          <span className={nf.topicCount}>
            {topicCount} {topicCount === 1 ? 'update' : 'updates'}
          </span>
          {topics.length === 1 ? (
            <FollowButton
              following={followedTopics.has(topics[0])}
              onClick={() =>
                setFollowedTopics((prev) => {
                  const next = new Set(prev);
                  if (next.has(topics[0])) next.delete(topics[0]);
                  else next.add(topics[0]);
                  return next;
                })
              }
              name={`#${topics[0]}`}
              size="xs"
              tertiary
            />
          ) : (
            <button type="button" className={local.inlineLink} onClick={() => setTopics([])}>
              Clear all
            </button>
          )}
          {relatedTags.length > 0 && (
            <span className={local.tagSuggest}>
              <span className={local.tagSuggestLabel}>Narrow by</span>
              {relatedTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={local.tagAdd}
                  aria-label={`Also filter by #${t}`}
                  onClick={() => toggleTopic(t)}
                >
                  + #{t}
                </button>
              ))}
            </span>
          )}
        </div>
      )}

      {/* Production's ForYouHint, where production puts it (head of the stream, For You
          only), redrawn as a caption: the view's name, what it is made of (with "the
          teams you follow", the input the reader can change), and develop's
          "Tune For You" door to News preferences. No box: it labels a view the
          reader just chose, so it should read as the feed's own caption. */}
      {/* 2026-11-06 (user): the personalization message is back on every view, on the
          plain page ground (no card), with "Update your profile" as a blue text link right
          after the sentence instead of the far-right "Tune For You" link. */}
      <p className={clsx(local.personalizeText, local.personalizePlain)}>
        <span className={local.personalizeLabel}>For you</span> · Curated from your profile, your team, and the teams
        you follow.{' '}
        <a href="/settings/profile" className={local.forYouLink}>
          Update your profile
        </a>
      </p>

      {/* The cut: full cards down to the rail's end, the next fading into the page under "See all".
          A feed that visibly ends is what tells the reader Home goes on below it. */}
      <div
        ref={listRef}
        className={clsx(v0.feedList, local.cutList, cut && local.cutListFaded)}
        style={cut ? { maxHeight: fit.clip } : undefined}
      >
        {visible.map((row, i) => (
          <div
            key={row.id}
            aria-hidden={cut && i >= fit.full ? true : undefined}
            inert={cut && i >= fit.full ? true : undefined}
          >
            {row.newsUid
              ? renderNews(storyFor(row.newsUid), topicProps, topStoryUids.includes(row.newsUid))
              : renderForum(row.forumUid!, topicProps)}
          </div>
        ))}
      </div>

      {visible.length === 0 && q && (
        <p className={local.weekEmpty}>
          No updates match “{query.trim()}”.{' '}
          <button type="button" className={local.inlineLink} onClick={() => setQuery('')}>
            Clear search
          </button>
        </p>
      )}

      <a href={seeAll.href} className={clsx(jobsCss.expander, local.cutSeeAll, cut && local.cutSeeAllOnFade)}>
        {seeAll.label}
      </a>
    </section>
  );
}
