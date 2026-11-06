'use client';

/**
 * For You levers — four ways to tell a member what their For You feed is made
 * of, switched with `?variant=current|follow|explain|thin-feed`.
 *
 * Only the three confirmed inputs are modelled or named (see README.md):
 * the teams you're on, the teams you follow, and Teams-to-follow matches whose
 * reason is your team's focus area. Profile fields are deliberately absent.
 *
 * Every variant closes the loop in the mock: follow or unfollow and For You
 * re-derives on the spot, the affected card flagged "New in your feed".
 *
 * Reuse:
 *   ForYouHint.module.scss (production) .... the hint's grey slab + link, all variants
 *   NewsCard / NewsfeedV0 modules ......... card + rail styling (via ForYouCard)
 *   components/ui/FollowButton ............ rail + inline suggestion Follow (as FollowTeamsCard)
 *   components/common/Button .............. "Follow more teams"
 *   follow-shared/FollowToast ............. confirmation after a follow/unfollow
 *   nav-shared/PrototypeNavBar ............ the header
 */

import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { FollowButton as RailFollowButton } from '@/components/ui/FollowButton';
import { getTeamLogoFallback } from '@/components/page/home/TeamNews/utils/getTeamLogoFallback';

import hint from '@/components/page/home/TeamNews/components/ForYouHint/ForYouHint.module.scss';
import s from '@/components/page/home/TeamNews/components/NewsCard/NewsCard.module.scss';
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import nf from '../newsfeed/Newsfeed.module.scss';
import local from './ForYouLevers.module.scss';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { FollowToast } from '../follow-shared/FollowToast';
import { ForYouCard } from './ForYouCard';
import {
  INITIAL_FOLLOWS,
  STORIES,
  SUGGESTED_TEAM_UIDS,
  TEAMS,
  THIN_FEED_THRESHOLD,
  VARIANTS,
  VIEWER,
  type FeedSize,
  type Variant,
} from './mocks';

const DESKTOP_QUERY = '(min-width: 1200px)';
const memberTeamUids = new Set(VIEWER.teams.map((t) => t.uid));

/** Lever 3: a Teams-to-follow suggestion whose reason is one of your team's focus areas. */
const isFocusMatch = (teamUid: string) =>
  SUGGESTED_TEAM_UIDS.includes(teamUid) && VIEWER.teamFocusAreas.includes(TEAMS[teamUid].focusArea);

/** Where "Update" goes: the News preferences prototype, as Home v2's hint does. */
const NEWS_PREFERENCES_HREF = '/prototypes/digest-topics?from=feed';

function readVariant(): Variant {
  if (typeof window === 'undefined') return 'settings';
  const v = new URLSearchParams(window.location.search).get('variant');
  return VARIANTS.some((x) => x.id === v) ? (v as Variant) : 'settings';
}

const Arrow = () => (
  <svg className={local.arrow} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
    <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
  </svg>
);

export default function ForYouLeversPrototype() {
  // Client-only: the variant comes from the URL and the feed from Date.now().
  const [mounted, setMounted] = useState(false);
  const [variant, setVariant] = useState<Variant>('settings');
  const [feedSize, setFeedSize] = useState<FeedSize>('quiet');
  /** `settings` variant only: has the member set up For You yet? */
  const [forYouSet, setForYouSet] = useState(true);

  const [follows, setFollows] = useState<Set<string>>(() => new Set(INITIAL_FOLLOWS.quiet));
  /** Teams whose story joined For You this session, most recent first. */
  const [added, setAdded] = useState<string[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [railPulse, setRailPulse] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVariant(readVariant());
    setForYouSet(new URLSearchParams(window.location.search).get('state') !== 'not-set');
    setMounted(true);
  }, []);

  // ---------- Mocked analytics ----------
  const track = useCallback(
    (event: string, props: Record<string, unknown> = {}) => {
      // eslint-disable-next-line no-console
      console.log('[analytics]', event, { variant, feedSize, ...props });
    },
    [variant, feedSize],
  );

  // ---------- For You, derived from the three levers ----------
  const forYouTeams = useMemo(() => {
    const set = new Set<string>(memberTeamUids);
    follows.forEach((uid) => set.add(uid));
    SUGGESTED_TEAM_UIDS.filter(isFocusMatch).forEach((uid) => set.add(uid));
    return set;
  }, [follows]);

  const stories = useMemo(() => {
    const inFeed = STORIES.filter((st) => forYouTeams.has(st.teamUid));
    const rank = (uid: string) => {
      const i = added.indexOf(uid);
      return i === -1 ? Number.MAX_SAFE_INTEGER : i;
    };
    return inFeed.sort(
      (a, b) =>
        rank(a.teamUid) - rank(b.teamUid) || new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
    );
  }, [forYouTeams, added]);

  // Not set up yet: nothing is picked for you, so the page falls back to every
  // story, newest first — production opens on All for the same member.
  const networkStories = useMemo(
    () => [...STORIES].sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()),
    [],
  );

  // Suggestions are a snapshot per session state, so a row you just followed
  // stays put and shows "Following" instead of vanishing under your cursor.
  const railSuggestions = useMemo(
    () => SUGGESTED_TEAM_UIDS.filter((uid) => !INITIAL_FOLLOWS[feedSize].includes(uid)).slice(0, 4),
    [feedSize],
  );
  // Inline (thin-feed): only teams that would actually add a story.
  const inlineSuggestions = useMemo(
    () =>
      SUGGESTED_TEAM_UIDS.filter((uid) => !INITIAL_FOLLOWS[feedSize].includes(uid) && !isFocusMatch(uid)).slice(0, 3),
    [feedSize],
  );

  // Whether the thin-feed ask is showing is decided on arrival, not live — it
  // must not vanish mid-click when the third follow tips the count over.
  const [thinAtArrival, setThinAtArrival] = useState(false);

  // Reset the session when the variant or the feed size changes.
  useEffect(() => {
    if (!mounted) return;
    const initial = new Set(INITIAL_FOLLOWS[feedSize]);
    setFollows(initial);
    setAdded([]);
    setPanelOpen(false);
    setToast(null);
    const count = STORIES.filter(
      (st) => memberTeamUids.has(st.teamUid) || initial.has(st.teamUid) || isFocusMatch(st.teamUid),
    ).length;
    const thin = count < THIN_FEED_THRESHOLD;
    setThinAtArrival(thin);
    if (variant === 'thin-feed') {
      if (thin) console.log('[analytics]', 'team_news_for_you_thin_ask_viewed', { variant, feedSize, storyCount: count });
    } else {
      console.log('[analytics]', 'team_news_for_you_hint_viewed', { variant, feedSize, storyCount: count });
    }
  }, [mounted, variant, feedSize]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const switchVariant = (next: Variant) => {
    setVariant(next);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', next);
    window.history.replaceState(null, '', url.toString());
  };

  // ---------- Levers ----------
  const toggleFollow = (teamUid: string, source: 'card' | 'rail' | 'inline' | 'panel') => {
    const name = TEAMS[teamUid].name;
    const wasFollowing = follows.has(teamUid);
    const next = new Set(follows);
    if (wasFollowing) next.delete(teamUid);
    else next.add(teamUid);
    setFollows(next);

    // Would this team be in For You without the follow? Then nothing moves.
    const inViaOtherLever = memberTeamUids.has(teamUid) || isFocusMatch(teamUid);
    const storyCountAfter = STORIES.filter(
      (st) => memberTeamUids.has(st.teamUid) || next.has(st.teamUid) || isFocusMatch(st.teamUid),
    ).length;

    if (wasFollowing) {
      setAdded((a) => a.filter((uid) => uid !== teamUid));
      setToast(inViaOtherLever ? `Unfollowed ${name}. Still in For You.` : `Unfollowed ${name}. Removed from For You.`);
      track('team_news_for_you_team_unfollowed', { teamUid, source, storyCountAfter });
    } else {
      if (!inViaOtherLever) setAdded((a) => [teamUid, ...a.filter((uid) => uid !== teamUid)]);
      setToast(inViaOtherLever ? `Following ${name}. Already in For You.` : `Following ${name}. Added to For You.`);
      track('team_news_for_you_team_followed', { teamUid, source, storyCountAfter });
    }
  };

  const onFollowMore = () => {
    track('team_news_for_you_follow_more_clicked');
    // Desktop has the rail beside the feed: take the reader to it. Below that
    // the rail is under every story, so the suggestions open in place instead.
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      railRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setRailPulse(true);
      window.setTimeout(() => setRailPulse(false), 1600);
    } else {
      setPanelOpen((o) => !o);
    }
  };

  const reasonFor = (teamUid: string): string => {
    if (memberTeamUids.has(teamUid)) return 'Your team';
    if (follows.has(teamUid)) return `You follow ${TEAMS[teamUid].name}`;
    if (isFocusMatch(teamUid)) return `Matches your team’s focus: ${TEAMS[teamUid].focusArea}`;
    return '';
  };

  // ---------- Pieces ----------
  const suggestionRows = (uids: string[], source: 'rail' | 'inline') =>
    uids.map((uid) => {
      const team = TEAMS[uid];
      return (
        <div key={uid} className={v0.railRow}>
          {team.logo ? (
            <img className={s.logo} src={team.logo} alt="" loading="lazy" />
          ) : (
            <div className={s.logoFallback}>{getTeamLogoFallback(team.name)}</div>
          )}
          <span className={v0.railInfo}>
            <span className={v0.railNameRow}>
              <span className={v0.railName}>{team.name}</span>
              <RailFollowButton
                following={follows.has(uid)}
                onClick={() => toggleFollow(uid, source)}
                name={team.name}
                size="default"
                className={v0.railFollowBtn}
              />
            </span>
            <span className={nf.railWhy}>{team.focusArea}</span>
          </span>
        </div>
      );
    });

  const followedList = Array.from(follows);

  const notSetUp = variant === 'settings' && !forYouSet;

  const renderHint = () => {
    switch (variant) {
      case 'settings':
        // Production's words on the plain page, the action as a link on the right.
        return (
          <div className={local.plainHint}>
            <p className={local.plainHintText}>
              {forYouSet ? (
                <>
                  <span className={local.plainHintLabel}>For you</span> · Curated based on your profile, primary team
                  attributes, and the teams you follow.
                </>
              ) : (
                <>
                  <span className={local.plainHintLabel}>For you</span> · Not set up yet. Choose topics and teams in
                  Settings to see news picked for you.
                </>
              )}
            </p>
            <a
              href={NEWS_PREFERENCES_HREF}
              className={local.plainHintLink}
              onClick={() => track('team_news_for_you_tune_clicked', { memberUid: VIEWER.uid, forYouSet })}
            >
              {forYouSet ? 'Update For You' : 'Set up For You'} <Arrow />
            </a>
          </div>
        );

      case 'current':
        // Production's ForYouHint, verbatim words and styles; the link logs
        // instead of opening the profile.
        return (
          <p className={hint.root}>
            For you: Curated based on your profile, primary team attributes, and the teams you follow.{' '}
            <a
              href="#"
              className={hint.link}
              onClick={(e) => {
                e.preventDefault();
                track('team_news_for_you_update_profile_clicked', { memberUid: VIEWER.uid });
              }}
            >
              Update your profile
            </a>{' '}
            to make it more relevant.
          </p>
        );

      case 'follow':
        return (
          <div className={local.hintBlock}>
            <div className={clsx(hint.root, local.hintRow)}>
              <span>Your feed shows news from your teams and the teams you follow.</span>
              <Button style="border" variant="primary" size="s" onClick={onFollowMore} className={local.hintButton}>
                Follow more teams
              </Button>
            </div>
            {panelOpen && (
              <div className={clsx(s.card, v0.railCard, local.inlinePanel)}>
                <h3 className={v0.railTitle}>Teams to follow</h3>
                {suggestionRows(railSuggestions, 'inline')}
              </div>
            )}
          </div>
        );

      case 'explain':
        return (
          <div className={local.hintBlock}>
            <p className={clsx(hint.root, local.hintRow)}>
              <span>
                <span className={local.hintLabel}>For you</span>
                Based on your teams and the teams you follow.
              </span>
              <button
                type="button"
                className={clsx(hint.link, local.linkButton)}
                aria-expanded={panelOpen}
                onClick={() => {
                  if (!panelOpen) track('team_news_for_you_manage_follows_clicked', { followCount: follows.size });
                  setPanelOpen((o) => !o);
                }}
              >
                {panelOpen ? 'Done' : 'Manage followed teams'}
              </button>
            </p>
            {panelOpen && (
              <div className={clsx(s.card, v0.railCard, local.inlinePanel)}>
                <h3 className={v0.railTitle}>Teams you follow · {followedList.length}</h3>
                {followedList.length === 0 && <p className={local.panelEmpty}>You don’t follow any teams.</p>}
                {followedList.map((uid) => {
                  const team = TEAMS[uid];
                  return (
                    <div key={uid} className={v0.railRow}>
                      {team.logo ? (
                        <img className={s.logo} src={team.logo} alt="" loading="lazy" />
                      ) : (
                        <div className={s.logoFallback}>{getTeamLogoFallback(team.name)}</div>
                      )}
                      <span className={v0.railInfo}>
                        <span className={v0.railNameRow}>
                          <span className={v0.railName}>{team.name}</span>
                          <RailFollowButton
                            following
                            onClick={() => toggleFollow(uid, 'panel')}
                            name={team.name}
                            size="default"
                            className={v0.railFollowBtn}
                          />
                        </span>
                        <span className={nf.railWhy}>{team.focusArea}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'thin-feed':
        if (!thinAtArrival) return null;
        return (
          <section className={clsx(s.card, v0.railCard, local.thinAsk)} aria-labelledby="thin-ask-title">
            <h2 id="thin-ask-title" className={local.thinTitle}>
              Your feed is quiet.
            </h2>
            <p className={local.thinBody}>Follow teams in areas you care about.</p>
            <div className={local.thinRows}>{suggestionRows(inlineSuggestions, 'inline')}</div>
          </section>
        );
    }
  };

  if (!mounted) return <div className={local.page} />;

  return (
    <div className={local.page}>
      <PrototypeNavBar hasUnreadNews={false} newsHref="/prototypes/for-you-levers" isLoggedIn />

      {/* Prototype chrome, not product UI. */}
      <div className={local.switcher} role="group" aria-label="Prototype controls">
        <div className={local.switchGroup}>
          <span className={local.switchLabel}>Variant</span>
          <div className={local.segmented}>
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                className={clsx(local.segment, variant === v.id && local.segmentActive)}
                aria-pressed={variant === v.id}
                onClick={() => switchVariant(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className={local.switchGroup}>
          <span className={local.switchLabel}>Feed</span>
          <div className={local.segmented}>
            {(['quiet', 'busy'] as FeedSize[]).map((f) => (
              <button
                key={f}
                type="button"
                className={clsx(local.segment, feedSize === f && local.segmentActive)}
                aria-pressed={feedSize === f}
                onClick={() => setFeedSize(f)}
              >
                {f === 'quiet' ? 'Quiet week' : 'Busy week'}
              </button>
            ))}
          </div>
        </div>
        {variant === 'settings' && (
          <div className={local.switchGroup}>
            <span className={local.switchLabel}>For You</span>
            <div className={local.segmented}>
              {[true, false].map((set) => (
                <button
                  key={String(set)}
                  type="button"
                  className={clsx(local.segment, forYouSet === set && local.segmentActive)}
                  aria-pressed={forYouSet === set}
                  onClick={() => setForYouSet(set)}
                >
                  {set ? 'Set up' : 'Not set up yet'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className={local.layout}>
        <div className={local.feedCol}>
          <header className={local.feedHeader}>
            <h1 className={local.feedTitle}>For You</h1>
            <span className={local.count}>
              {notSetUp
                ? 'Latest from the network'
                : `${stories.length} ${stories.length === 1 ? 'story' : 'stories'} this week`}
            </span>
          </header>

          {renderHint()}

          <div className={local.cards}>
            {(notSetUp ? networkStories : stories).map((st) => (
              <ForYouCard
                key={st.uid}
                story={st}
                following={follows.has(st.teamUid)}
                onToggleFollow={memberTeamUids.has(st.teamUid) ? undefined : () => toggleFollow(st.teamUid, 'card')}
                reason={variant === 'explain' ? reasonFor(st.teamUid) : undefined}
                isNew={added.includes(st.teamUid)}
                liked={liked.has(st.uid)}
                onToggleLike={() =>
                  setLiked((prev) => {
                    const next = new Set(prev);
                    if (next.has(st.uid)) next.delete(st.uid);
                    else next.add(st.uid);
                    return next;
                  })
                }
              />
            ))}
          </div>
        </div>

        {/* The thin-feed ask carries its own suggestions; a second list in the
            rail would be the same teams twice. */}
        <aside className={local.railCol} hidden={variant === 'thin-feed' && thinAtArrival}>
          <div
            ref={railRef}
            className={clsx(s.card, v0.railCard, v0.followRailCard, railPulse && local.railPulse)}
            id="teams-to-follow"
          >
            <h3 className={v0.railTitle}>Teams to follow</h3>
            {suggestionRows(railSuggestions, 'rail')}
          </div>
        </aside>
      </main>

      {toast && <FollowToast>{toast}</FollowToast>}
    </div>
  );
}
