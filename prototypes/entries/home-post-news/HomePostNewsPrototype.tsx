'use client';

/**
 * LAB-3316: "Post news" on the signed-in Home, for team leads.
 *
 * Target: the new Home (`NEXT_PUBLIC_SHOW_HOME_V2`, `components/page/home/HomeV2/SignedInHome.tsx`).
 * The old Home is out of scope.
 *
 * Placement: the end of the Network Updates header, after production's search
 * icon. The header slot is where the section keeps its own actions, and the
 * new story lands right under it, first in the stream. On phones the search
 * icon is hidden (production), so the button stands alone at the end of the
 * title row and scrolls away with the page: no floating button over the cards.
 *
 * Who sees it: a member whose `leadingTeams` is not empty. Anyone else gets no
 * button and no empty slot: the header keeps only the search.
 *
 * Reuse map
 *   IMPORT  Button, PlusIcon, Modal, FormField, FormEditor, FormSelect, useFormDraft (production)
 *           NewsSearch, SearchInput, FeedFilterBar, nb.title / nb.sub (production Home)
 *           HomeV2.module.scss: memberPage, newsRow, weekFeed, sectionHead, weekHeadActions, rail, sidebar
 *           PostNewsModal.module.scss: postAction, newsPosted (production team news)
 *           V0FeedCard, JobsRail, TeamsToFollowRail, SignedOutHome, FollowToast, nav (prototype siblings)
 *   COPY    PostNewsButton (useOneTimeCallout reads the session) -> HomePostNewsButton
 *           PostNewsModal (services import) -> ./PostNewsModal + "Post as" picker (LAB-3202)
 *   TOKENS  brand hover var(--action-background-brand-hover, #0f3cd9)
 */

import clsx from 'clsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ITeamNewsItem } from '@/types/team-news.types';
import home from '@/app/page.module.css';
import { SearchInput } from '@/components/common/filters/SearchInput';
import { FeedFilterBar } from '@/components/page/home/HomeV2/FeedFilterBar';
import { NewsSearch } from '@/components/page/home/TeamNews/components/NewsSearch';
import { ALL_CAT, type TeamNewsCategoryId } from '@/components/page/home/TeamNews/constants';
import tn from '@/components/page/home/TeamNews/TeamNews.module.scss';
import nb from '@/components/page/home/TeamNews/components/NewsBase/NewsBase.module.scss';
import hv from '@/components/page/home/HomeV2/HomeV2.module.scss';
import prodNews from '@/components/page/team-details/TeamNews/PostNewsModal/PostNewsModal.module.scss';

import { V0FeedCard } from '../newsfeed-v0/V0FeedCard';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import feedCss from '../newsfeed/Newsfeed.module.scss';
import { deriveDomain } from '../team-profile/newsUrl';
import { weekNewsItem, WEEK_LIKES } from '../home-refactor-b/mocks';
import { JobsRail } from '../home-refactor/JobsRail';
import { TeamsToFollowRail } from '../home-v2/TeamsToFollowRail';
import { SignedOutHome } from '../home-v2/SignedOutHome';
import { IMAGE_BY_UID, PROD_TAGS_BY_UID, SUGGESTED_TEAMS, TOTAL_OPEN_ROLES, rolesBesideEvents } from '../home-v2/mocks';
import { FollowToast } from '../follow-shared/FollowToast';
import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { useHeaderSearch } from '../home-ai-ask/useHeaderSearch';

import { HomePostNewsButton } from './HomePostNewsButton';
import { PostNewsModal, type PostNewsSubmission } from './PostNewsModal';
import {
  LEAD_TEAMS,
  MOCK_CATEGORIES,
  SAMPLE_POST,
  STATE_OPTIONS,
  STREAM_UIDS,
  VIEWER_OPTIONS,
  isButtonState,
  isViewer,
  type ButtonState,
  type Viewer,
} from './mocks';
import s from './HomePostNews.module.scss';

type Option<T extends string> = { value: T; label: string; note: string };

/* home-v2's review switch (newsfeed-v0 chrome). Review scaffolding, not part of the design. */
function Switch<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className={v0.switchBar}>
      <span className={v0.switchLabel}>{label}</span>
      <div className={clsx(v0.switch, s.reviewSwitch)} role="tablist" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={value === o.value}
            className={clsx(v0.switchBtn, value === o.value && v0.switchBtnActive)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className={clsx(v0.switchNote, feedCss.reviewNote)}>{options.find((o) => o.value === value)!.note}</span>
    </div>
  );
}

const PUBLISH_DELAY_MS = 1200;

export default function HomePostNewsPrototype() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
  }, []);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawViewer = searchParams.get('view');
  const viewer: Viewer = isViewer(rawViewer) ? rawViewer : 'one-team';
  const rawState = searchParams.get('state');
  const state: ButtonState = isButtonState(rawState) ? rawState : 'default';

  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };
  const setViewer = (v: Viewer) => setParams({ view: v === 'one-team' ? null : v, state: null });
  const setState = (v: ButtonState) => setParams({ state: v === 'default' ? null : v });

  const signedIn = viewer !== 'signed-out';
  const leadTeams = viewer === 'one-team' || viewer === 'several-teams' ? LEAD_TEAMS[viewer] : [];
  const isLead = leadTeams.length > 0;
  const navExtras = useHeaderSearch(signedIn);

  /* The live flow: press -> form -> Post -> "Posting…" -> toast + new story. */
  const [publishing, setPublishing] = useState(false);
  const [posted, setPosted] = useState<ITeamNewsItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [washKey, setWashKey] = useState(0);
  useEffect(() => {
    if (!toast || state === 'posted') return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast, state]);

  const makeStory = (post: { teamUid: string; title: string; body: string; url: string }): ITeamNewsItem => {
    const base = weekNewsItem(STREAM_UIDS[0], now ?? new Date());
    const team = leadTeams.find((t) => t.uid === post.teamUid) ?? leadTeams[0];
    return {
      ...base,
      uid: `posted-${post.teamUid}-${post.title.length}-${post.url.length}`,
      teamUid: team?.uid ?? post.teamUid,
      teamName: team?.name ?? '',
      teamLogoUrl: null,
      eventType: 'ANNOUNCEMENT',
      eventDate: (now ?? new Date()).toISOString(),
      title: post.title,
      summary: post.body.replace(/<[^>]+>/g, ' ').trim() || null,
      contentHtml: post.body || undefined,
      sourceUrl: post.url,
      sourceDomain: deriveDomain(post.url),
      tags: [],
      viewCount: 0,
      upvoteCount: 0,
    } as ITeamNewsItem;
  };

  // Review state "Posted": the sample post at the top of the stream and the toast held open.
  const reviewPosted = useMemo(
    () =>
      state === 'posted' && isLead
        ? [makeStory({ teamUid: leadTeams[leadTeams.length > 1 ? 1 : 0].uid, ...SAMPLE_POST })]
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, isLead, viewer, now],
  );
  // A new view starts clean; the review state "Posted" holds the toast open.
  useEffect(() => {
    setPosted([]);
    setToast(null);
  }, [viewer]);
  useEffect(() => {
    if (state === 'posted' && isLead) {
      const team = leadTeams[leadTeams.length > 1 ? 1 : 0];
      setToast(team.name);
      setWashKey((k) => k + 1);
    } else if (state !== 'default') {
      setToast(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, viewer]);

  const formOpen = isLead && (state === 'form' || state === 'posting');
  const forcedPublishing = state === 'posting';

  const handlePublish = async (post: PostNewsSubmission) => {
    setPublishing(true);
    await new Promise((r) => window.setTimeout(r, PUBLISH_DELAY_MS));
    setPublishing(false);
    setPosted((prev) => [makeStory(post), ...prev]);
    setWashKey((k) => k + 1);
    const team = leadTeams.find((t) => t.uid === post.teamUid);
    setToast(team?.name ?? '');
    setParams({ state: null });
  };

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [category, setCategory] = useState<TeamNewsCategoryId>(ALL_CAT);
  const [sort, setSort] = useState('newest');
  const [followed, setFollowed] = useState<Set<string>>(new Set());
  const toggleFollow = (uid: string) =>
    setFollowed((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  const storyFor = (uid: string): ITeamNewsItem => {
    const item = weekNewsItem(uid, now ?? new Date());
    return { ...item, tags: PROD_TAGS_BY_UID[uid] ?? item.tags };
  };
  const likeCount = (uid: string) => WEEK_LIKES[uid] ?? 0;
  const newStories = [...reviewPosted, ...posted];
  const stream = [...newStories, ...STREAM_UIDS.map(storyFor)];

  if (!mounted) return <div className={s.mountShell} />;

  const renderCard = (story: ITeamNewsItem) => (
    <V0FeedCard
      cluster={{
        teamUid: story.teamUid,
        teamName: story.teamName,
        teamLogoUrl: story.teamLogoUrl,
        lead: story,
        rest: [],
        isLeadNewest: true,
      }}
      following={followed.has(story.teamUid)}
      onToggleFollow={() => toggleFollow(story.teamUid)}
      showComments={false}
      likeCount={likeCount}
      isLiked={() => false}
      onToggleLike={() => undefined}
      commentsFor={() => []}
      onAddComment={() => undefined}
      onOpenStory={() => undefined}
      imageFor={(uid) => IMAGE_BY_UID[uid]}
    />
  );

  return (
    <>
      <PrototypeNavBar
        hasUnreadNews={false}
        active
        isLoggedIn={signedIn}
        onSignIn={() => setViewer('one-team')}
        onSignUp={() => setViewer('one-team')}
        {...navExtras}
        eventsInMore
      />
      <PrototypeMobileNav hasUnreadNews={false} active />

      {/* Review scaffolding: scrolls away; not part of the design. */}
      <div className={feedCss.reviewBand}>
        <div className={feedCss.reviewRow}>
          <Switch label="Viewer" options={VIEWER_OPTIONS} value={viewer} onChange={setViewer} />
          {isLead && <Switch label="State" options={STATE_OPTIONS} value={state} onChange={setState} />}
        </div>
      </div>

      {signedIn ? (
        <div className={home.home}>
          <div className={clsx(home.home__cn, hv.memberPage)}>
            <div className={hv.newsRow}>
              <section className={hv.weekFeed} aria-labelledby="home-week-title">
                <div className={hv.sectionHead}>
                  <h2 id="home-week-title" className={nb.title}>
                    Network Updates
                  </h2>
                  <span className={clsx(hv.weekHeadActions, s.headActions)}>
                    <NewsSearch
                      open={searchOpen}
                      value={query}
                      onOpen={() => setSearchOpen(true)}
                      onChange={setQuery}
                      fieldRef={searchRef}
                      onBlur={(e) => {
                        if (e.currentTarget.contains(e.relatedTarget as Node) || query.trim()) return;
                        setSearchOpen(false);
                      }}
                    />
                    {/* NEW (LAB-3316): leads only. Not rendered at all for anyone else. */}
                    {isLead && (
                      <HomePostNewsButton forceHover={state === 'hover'} onPost={() => setParams({ state: 'form' })} />
                    )}
                  </span>
                </div>
                <p className={clsx(nb.sub, hv.weekSub)}>
                  Recent shipping, raises, partnerships, and milestones from across the network.
                </p>
                <div className={tn.mobileSearchRow}>
                  <SearchInput value={query} onChange={setQuery} placeholder="Search by news, teams…" />
                </div>
                <FeedFilterBar
                  categories={MOCK_CATEGORIES}
                  activeCategory={category}
                  onCategory={setCategory}
                  sort={sort}
                  onSort={setSort}
                  className={hv.weekFilterBar}
                />
                <div className={clsx(v0.feedList, s.stream)}>
                  {stream.map((story, i) => (
                    <div
                      key={i < newStories.length ? `${story.uid}-${washKey}` : story.uid}
                      className={clsx(i < newStories.length && prodNews.newsPosted)}
                    >
                      {renderCard(story)}
                    </div>
                  ))}
                </div>
              </section>

              <aside className={hv.rail}>
                <div className={hv.sidebar}>
                  <JobsRail jobs={rolesBesideEvents(false)} total={TOTAL_OPEN_ROLES} />
                  <TeamsToFollowRail
                    suggestions={SUGGESTED_TEAMS}
                    followedTeamUids={followed}
                    onFollow={toggleFollow}
                  />
                </div>
              </aside>
            </div>
          </div>
        </div>
      ) : (
        <SignedOutHome
          storyFor={storyFor}
          allHref="#"
          likeCount={likeCount}
          commentCount={() => 0}
          onOpenStory={() => undefined}
          onSignUp={() => setViewer('one-team')}
          onSignIn={() => setViewer('one-team')}
        />
      )}

      {isLead && (
        <PostNewsModal
          key={viewer}
          open={formOpen}
          onClose={() => setParams({ state: null })}
          teamChoices={leadTeams}
          initialTeamUid={forcedPublishing && leadTeams.length > 1 ? leadTeams[1].uid : ''}
          existing={stream}
          onPublish={handlePublish}
          isPublishing={publishing || forcedPublishing}
          prefill={forcedPublishing ? SAMPLE_POST : undefined}
        />
      )}

      {/* Production's success copy (DigestPostNews), in the prototype toast. */}
      {toast !== null && (
        <FollowToast>
          Posted as <strong>{toast}</strong>. It&apos;s on the network feed now.
        </FollowToast>
      )}
    </>
  );
}
