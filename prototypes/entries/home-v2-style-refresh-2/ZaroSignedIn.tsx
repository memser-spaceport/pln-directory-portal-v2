'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';

import type { ISuggestedTeam, ITeamNewsItem } from '@/types/team-news.types';
import type { IDeal } from '@/types/deals.types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { AppLogo } from '@/components/core/navbar/components/icons';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { EVENT_TYPE_LABEL } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';
import { SORT_OPTIONS, type TeamNewsSort } from '@/components/page/home/TeamNews/utils/sortTeamNewsClusters';

import type { ForumPost } from '../newsfeed-v0/mocks';
import type { CuratedRepo, HomeJob } from '../home-refactor/mocks';
import type { PopularRailItem } from './PopularThisWeekRail';

import { grotesk, mono } from './zaroFonts';
import z from './Zaro.module.scss';
import m from './ZaroMember.module.scss';

/** Threads per carousel page beside the rail. */
const FORUM_PAGE = 3;
/** Stories in the stream before "See all news". */
const STREAM_CAP = 5;

const Arrow = ({ dir = 'right' }: { dir?: 'right' | 'left' }) => (
  <svg
    className={z.arrow}
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden
    style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}
  >
    <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
  </svg>
);

const Heart = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
    <path
      d="M8 13.5S2 10 2 6a3 3 0 0 1 6-.8A3 3 0 0 1 14 6c0 4-6 7.5-6 7.5Z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.3"
    />
  </svg>
);

const Bubble = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path d="M2.5 3.5h11v7.5H7l-3 2.5V11H2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

/** A square mark for an organisation: its logo, or its initial on the ground tint. */
function OrgMark({ src, name, size = 28 }: { src?: string | null; name: string; size?: number }) {
  return src ? (
    <img className={m.orgMark} src={src} alt="" width={size} height={size} />
  ) : (
    <span className={clsx(m.orgMark, m.orgMarkFallback)} style={{ width: size, height: size }} aria-hidden>
      {name.charAt(0)}
    </span>
  );
}

/* ---------- Navigation ---------- */

const NAV = [
  { label: 'Directory', items: [['Members', '/members'], ['Teams', '/teams'], ['Projects', '/projects']] },
  { label: 'Network', items: [['Job Board', '/jobs'], ['Events', '/events/irl'], ['Forum', '/forum'], ['Demo Day', '/demoday']] },
  { label: 'More', items: [['Deals', '/deals'], ['AI Apps', '/ai-apps'], ['Founder guides', '/founder-guides']] },
] as const;

/**
 * B's left sidebar in the reference's grammar: paper column, hairline edge, plain group labels, the
 * current page marked by a ground fill, the member at the foot.
 */
export function ZaroSidebar() {
  return (
    <aside className={clsx(m.sidebar, grotesk.variable, mono.variable)} aria-label="Main">
      <Link href="/prototypes/home-v2-style-refresh-2?state=signed-in" className={m.sideLogo}>
        <AppLogo />
        <span>Protocol Labs</span>
      </Link>
      <nav className={m.sideNav}>
        <Link href="/prototypes/home-v2-style-refresh-2?state=signed-in" className={clsx(m.sideLink, m.sideLinkActive)} aria-current="page">
          Home
        </Link>
        {NAV.map((g) => (
          <div key={g.label} className={m.sideGroup}>
            <p className={m.sideGroupLabel}>{g.label}</p>
            {g.items.map(([label, href]) => (
              <a key={href} href={href} className={m.sideLink}>
                {label}
              </a>
            ))}
          </div>
        ))}
      </nav>
      <div className={m.sideMe}>
        <span className={m.meAvatar} aria-hidden>
          Y
        </span>
        <span className={m.meText}>
          <strong>You</strong>
          <span>Member · Protocol Labs</span>
        </span>
      </div>
    </aside>
  );
}

/** Below 960 the sidebar has no room: a framed top bar with the logo and the member instead. */
export function ZaroMemberBar() {
  return (
    <div className={clsx(z.navWrap, m.memberBar, grotesk.variable, mono.variable)}>
      <nav className={z.nav} aria-label="Main">
        <Link href="/prototypes/home-v2-style-refresh-2?state=signed-in" className={z.navLogo}>
          <AppLogo />
          <span className={z.navWordmark}>Protocol Labs</span>
        </Link>
        <span className={clsx(m.meAvatar, m.barAvatar)} aria-label="You">
          Y
        </span>
      </nav>
    </div>
  );
}

/* ---------- Member page ---------- */

type Pill = { id: string; label: string; count: number };

/**
 * home-v2-b's member page — Network Updates over the forum and the news, a rail of Popular this week,
 * open roles, Teams to follow and deals, then the open-source picks — redrawn in zaro.ai's language:
 * plain titles, hairline grids instead of cards-on-cards, sentence-case labels in one family, a lavender
 * Top stories panel and a dark repos band. Same data and state as B (the parent owns it).
 */
export function ZaroSignedIn(props: {
  weekLabel: string;
  forumPosts: ForumPost[];
  onOpenForum: (post: ForumPost) => void;
  pills: Pill[];
  activeCat: string;
  onCat: (id: string) => void;
  forYouId: string;
  sort: TeamNewsSort;
  onSort: (s: TeamNewsSort) => void;
  topic: string;
  topicCount: number;
  onTopic: (tag: string) => void;
  topicFollowed: boolean;
  onToggleTopicFollow: () => void;
  topLead?: ITeamNewsItem;
  topAlso: ITeamNewsItem[];
  stream: ITeamNewsItem[];
  newsHref: string;
  likeCount: (uid: string) => number;
  isLiked: (uid: string) => boolean;
  onToggleLike: (uid: string) => void;
  commentCount: (uid: string) => number;
  followed: Set<string>;
  onToggleFollow: (teamUid: string) => void;
  onOpenStory: (story: ITeamNewsItem) => void;
  popular: PopularRailItem[];
  onOpenPopular: (uid: string) => void;
  roles: HomeJob[];
  totalRoles: number;
  teams: ISuggestedTeam[];
  deals: IDeal[];
  totalDeals: number;
  repos: CuratedRepo[];
  reposAttribution: string;
}) {
  const p = props;
  const [forumPage, setForumPage] = useState(0);
  const forumPages = Math.max(1, Math.ceil(p.forumPosts.length / FORUM_PAGE));
  const threads = p.forumPosts.slice(forumPage * FORUM_PAGE, forumPage * FORUM_PAGE + FORUM_PAGE);
  const stream = p.stream.slice(0, STREAM_CAP);

  const tags = (list: string[]) =>
    list.length > 0 && (
      <span className={m.hashtags}>
        {list.slice(0, 3).map((t) => (
          <button
            key={t}
            type="button"
            className={clsx(m.hashtag, p.topic === t && m.hashtagOn)}
            aria-pressed={p.topic === t}
            onClick={(e) => {
              e.stopPropagation();
              p.onTopic(t);
            }}
          >
            #{t}
          </button>
        ))}
      </span>
    );

  const actions = (uid: string, teamUid?: string, teamName?: string) => (
    <span className={m.actions}>
      <button
        type="button"
        className={clsx(m.action, p.isLiked(uid) && m.actionOn)}
        aria-pressed={p.isLiked(uid)}
        aria-label={p.isLiked(uid) ? 'Unlike' : 'Like'}
        onClick={(e) => {
          e.stopPropagation();
          p.onToggleLike(uid);
        }}
      >
        <Heart filled={p.isLiked(uid)} /> {p.likeCount(uid)}
      </button>
      <span className={m.actionStatic}>
        <Bubble /> {p.commentCount(uid)}
      </span>
      {teamUid && (
        <button
          type="button"
          className={clsx(m.followText, p.followed.has(teamUid) && m.followTextOn)}
          aria-pressed={p.followed.has(teamUid)}
          onClick={(e) => {
            e.stopPropagation();
            p.onToggleFollow(teamUid);
          }}
        >
          {p.followed.has(teamUid) ? 'Following' : `Follow ${teamName}`}
        </button>
      )}
    </span>
  );

  return (
    <div className={clsx(z.page, m.page, grotesk.variable, mono.variable)}>
      <header className={m.head}>
        <h1 className={m.headTitle}>Network updates</h1>
        <p className={m.headWeek}>Week of {p.weekLabel}</p>
      </header>

      <div className={m.row}>
        <div className={m.main}>
          {/* 1. Forum threads, newest first, three at a time. */}
          <section className={m.block} aria-labelledby="zm-forum">
            <div className={m.blockHead}>
              <h2 id="zm-forum" className={m.blockTitle}>
                From the forum
              </h2>
              <span className={m.pager}>
                <span className={m.pagerCount}>
                  {forumPage + 1} / {forumPages}
                </span>
                <button
                  type="button"
                  className={m.pagerBtn}
                  aria-label="Previous threads"
                  disabled={forumPage === 0}
                  onClick={() => setForumPage((n) => n - 1)}
                >
                  <Arrow dir="left" />
                </button>
                <button
                  type="button"
                  className={m.pagerBtn}
                  aria-label="Next threads"
                  disabled={forumPage >= forumPages - 1}
                  onClick={() => setForumPage((n) => n + 1)}
                >
                  <Arrow />
                </button>
              </span>
            </div>
            <div className={m.threads}>
              {threads.map((post) => (
                <article key={post.uid} className={m.thread} onClick={() => p.onOpenForum(post)}>
                  <span className={m.metaLine}>
                    {post.category} · {formatTimeAgo(post.createdAt)}
                  </span>
                  <button type="button" className={m.threadTitle} onClick={() => p.onOpenForum(post)}>
                    {post.title}
                  </button>
                  <p className={m.threadBody}>{post.body}</p>
                  <span className={m.byline}>
                    <strong>{post.author}</strong>
                    <span>{post.role}</span>
                  </span>
                  {actions(post.uid)}
                </article>
              ))}
            </div>
            <Link href="/forum" className={clsx(z.textLink, m.blockLink)}>
              See all threads <Arrow />
            </Link>
          </section>

          {/* 2. News updates: pills + sort, Top stories, then the stream. */}
          <section className={m.block} aria-labelledby="zm-news">
            <div className={m.blockHead}>
              <h2 id="zm-news" className={m.blockTitle}>
                News updates
              </h2>
              <a href={p.newsHref} className={z.textLink}>
                All news <Arrow />
              </a>
            </div>

            <div className={m.filters}>
              <div className={m.pills} role="group" aria-label="Category">
                {p.pills.map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    className={clsx(m.pill, p.activeCat === pill.id && m.pillOn)}
                    aria-pressed={p.activeCat === pill.id}
                    onClick={() => p.onCat(pill.id)}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
              <label className={m.sort}>
                <span>Sort</span>
                <select value={p.sort} onChange={(e) => p.onSort(e.target.value as TeamNewsSort)}>
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {p.topic ? (
              <div className={m.scope}>
                <span className={m.scopeCount}>Filter</span>
                <button
                  type="button"
                  className={m.scopeChip}
                  aria-label={`Clear the #${p.topic} filter`}
                  onClick={() => p.onTopic(p.topic)}
                >
                  #{p.topic} <CloseIcon width={12} height={12} aria-hidden />
                </button>
                <span className={m.scopeCount}>
                  {p.topicCount} {p.topicCount === 1 ? 'update' : 'updates'}
                </span>
                <button type="button" className={m.followText} onClick={p.onToggleTopicFollow}>
                  {p.topicFollowed ? 'Following' : 'Follow'}
                </button>
              </div>
            ) : (
              p.activeCat === p.forYouId && (
                <p className={m.caption}>
                  <span>
                    <strong>For you</strong> · Curated based on your profile, primary team attributes, and the teams you
                    follow.
                  </span>
                  <Link href="/prototypes/digest-topics?from=feed" className={z.textLink}>
                    Update For You <Arrow />
                  </Link>
                </p>
              )
            )}

            {p.topLead && (
              <div className={m.top}>
                <h3 className={m.topHead}>Top stories</h3>
                <button type="button" className={m.topLead} onClick={() => p.onOpenStory(p.topLead!)}>
                  <span className={m.metaLine}>
                    {p.topLead.teamName} · {EVENT_TYPE_LABEL[p.topLead.eventType]}
                  </span>
                  <span className={m.topTitle}>{p.topLead.title}</span>
                  {p.topLead.summary && <span className={m.topSummary}>{p.topLead.summary}</span>}
                </button>
                <ul className={m.topAlso}>
                  {p.topAlso.map((s) => (
                    <li key={s.uid}>
                      <button type="button" className={m.topRow} onClick={() => p.onOpenStory(s)}>
                        <span className={m.topRowMain}>
                          <span className={m.metaLine}>{s.teamName}</span>
                          <span>{s.title}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className={m.stream}>
              {stream.map((s) => (
                <article key={s.uid} className={m.story} onClick={() => p.onOpenStory(s)}>
                  <OrgMark src={s.teamLogoUrl} name={s.teamName} size={36} />
                  <div className={m.storyMain}>
                    <span className={m.metaLine}>
                      {s.teamName} · {EVENT_TYPE_LABEL[s.eventType]} · {formatTimeAgo(s.eventDate)}
                    </span>
                    <button type="button" className={m.storyTitle} onClick={() => p.onOpenStory(s)}>
                      {s.title}
                    </button>
                    {s.summary && <p className={m.storySummary}>{s.summary}</p>}
                    {tags(s.tags)}
                    {actions(s.uid, s.teamUid, s.teamName)}
                  </div>
                </article>
              ))}
              {stream.length === 0 && <p className={m.empty}>No updates here this week.</p>}
            </div>
            {p.stream.length > STREAM_CAP && (
              <a href={p.newsHref} className={clsx(z.btn, z.btnOutline, m.more)}>
                See all news <Arrow />
              </a>
            )}
          </section>
        </div>

        {/* Rail: one hairline column, each module a cell. */}
        <aside className={m.rail} aria-label="This week">
          <section className={m.cell} aria-labelledby="zm-popular">
            <h2 id="zm-popular" className={z.railTitle}>
              Popular this week
            </h2>
            <ol className={m.list}>
              {p.popular.map((item, i) => (
                <li key={item.uid}>
                  <button type="button" className={m.listRow} onClick={() => p.onOpenPopular(item.uid)}>
                    <span className={m.rank}>{i + 1}</span>
                    <span className={m.listMain}>
                      <span className={m.listTitle}>{item.title}</span>
                      <span className={m.listMeta}>
                        {item.teamName} · {item.upvoteCount} likes
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className={m.cell} aria-labelledby="zm-roles">
            <h2 id="zm-roles" className={z.railTitle}>
              Open roles
            </h2>
            <ul className={m.list}>
              {p.roles.map((r) => (
                <li key={`${r.teamUid}-${r.title}`}>
                  <a href={r.applyUrl} target="_blank" rel="noreferrer" className={m.listRow}>
                    <OrgMark src={r.teamLogoUrl} name={r.teamName} />
                    <span className={m.listMain}>
                      <span className={m.listTitle}>{r.title}</span>
                      <span className={m.listMeta}>
                        {r.teamName} · {r.location}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/jobs" className={z.textLink}>
              See all {p.totalRoles} jobs <Arrow />
            </Link>
          </section>

          <section className={m.cell} aria-labelledby="zm-teams">
            <h2 id="zm-teams" className={z.railTitle}>
              Teams to follow
            </h2>
            <ul className={m.list}>
              {p.teams.map((t) => (
                <li key={t.uid} className={m.teamRow}>
                  <OrgMark src={t.logo} name={t.name} />
                  <span className={m.listMain}>
                    <span className={m.listTitle}>{t.name}</span>
                    <span className={m.listMeta}>{t.reason}</span>
                  </span>
                  <button
                    type="button"
                    className={clsx(z.btn, z.btnSmall, z.btnOutline, m.followBtn, p.followed.has(t.uid) && m.followBtnOn)}
                    aria-pressed={p.followed.has(t.uid)}
                    onClick={() => p.onToggleFollow(t.uid)}
                  >
                    {p.followed.has(t.uid) ? 'Following' : 'Follow'}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={m.cell} aria-labelledby="zm-deals">
            <h2 id="zm-deals" className={z.railTitle}>
              New deals for your team
            </h2>
            <ul className={m.list}>
              {p.deals.slice(0, 3).map((d) => (
                <li key={d.uid}>
                  <Link href="/deals" className={m.listRow}>
                    <OrgMark src={d.logoUrl} name={d.vendorName} />
                    <span className={m.listMain}>
                      <span className={m.listTitle}>{d.vendorName}</span>
                      <span className={m.listMeta}>{d.shortDescription}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/deals" className={z.textLink}>
              See all {p.totalDeals} deals <Arrow />
            </Link>
          </section>
        </aside>
      </div>

      {/* 3. The network's open-source picks, on the dark band. */}
      <section className={m.repos} aria-labelledby="zm-repos">
        <div className={m.reposHead}>
          <h2 id="zm-repos" className={m.reposTitle}>
            Open source picks
          </h2>
          <p className={m.reposNote}>{p.reposAttribution}</p>
        </div>
        <div className={m.repoGrid}>
          {p.repos.slice(0, 6).map((r) => (
            <a key={r.name} href={r.url} target="_blank" rel="noreferrer" className={m.repo}>
              <span className={m.repoName}>{r.name}</span>
              <span className={m.repoDesc}>{r.description}</span>
              <span className={m.repoMeta}>
                <i style={{ background: r.languageColor }} /> {r.language} · ★ {(r.stars / 1000).toFixed(1)}k ·{' '}
                {r.teamName}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
