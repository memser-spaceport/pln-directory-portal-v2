'use client';

/**
 * REUSE MAP (reuse-scout, 2026-09-14) — what this entry imports vs. copies.
 *
 * IMPORTED 1:1 (production):
 *   DashboardPagesLayout, SortDropdown, JOBS_SORT_OPTIONS, toast (ToastContainer),
 *   JobsContent.module.scss, TeamNews shells (NewsBase/TeamNews.module.scss),
 *   home/page.module.css, TeamNews constants + utils, Button, Tabs (ui + common).
 * IMPORTED (sibling prototypes — the surfaces are theirs, the save is new):
 *   job-board/: JobBoardFilterView, JobBoardMobileFilters, JobTeamGroupCard,
 *     JobReferRoleRow (+`saved`/`savedAt`/`onToggleSave`), JobBoardScopeTabs
 *     (+`savedCount` → All · Saved · Applied), JobApplyFlowDrawer, viewerState,
 *     mocks, mockJobsFilterStore, JobBoardPrototype.module.scss (band, empty, tabs).
 *   newsfeed-v0/: V0FeedCard + ForumPostCard (+`isSaved`/`onToggleSave`),
 *     FeedActions (+`SaveButton`), NewsTabs, FeedRail,
 *     FeedDetailModal (`footerAction` slot), ForumPostModal, QuickActionsMock,
 *     MobileFeedSort, mocks, eventMeta, NewsfeedV0.module.scss (switch chrome).
 *   nav-shared/: PrototypeNavBar, PrototypeMobileNav.  follow-shared/: FollowToast.
 * NEW (this feature):
 *   save-shared/BookmarkIcon (currentColor glyph — the DS BookmarkIcon bakes
 *     in #1B4DFF and a filter id), save-shared/savedItems (session store),
 *     job-board/JobSaveButton (row bookmark in ReferMenu's `.trigger` chrome).
 * NOT REUSED, on purpose:
 *   Demo Day's TeamProfileCard Save (its `drawerEditButton` is a labelled 14px
 *     button for a card's action strip — the wrong rank for a row of roles),
 *   newsfeed-v0's SavedFilterChip (a saved *filter*, not a saved item),
 *   BookmarkTabs (tab chrome; nothing to do with saving).
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import clsx from 'clsx';

import { PrototypeNavBar } from '../nav-shared/PrototypeNavBar';
import { PrototypeMobileNav } from '../nav-shared/PrototypeMobileNav';
import { FollowToast } from '../follow-shared/FollowToast';
// The category's switch chrome and the board's review band, so the one piece
// of scaffolding here looks like every other entry's.
import v0 from '../newsfeed-v0/NewsfeedV0.module.scss';
import jb from '../job-board/JobBoardPrototype.module.scss';
import { useSavedItems } from '../save-shared/savedItems';

import { SavedJobBoard } from './SavedJobBoard';
import { SavedNewsfeed } from './SavedNewsfeed';
import s from './SavingPrototype.module.scss';

/**
 * Saving — jobs and news.
 *
 * **The decision this entry makes: a kept thing lives where its kind lives.**
 * Saved roles collect in a Saved tab on the job board, between All and
 * Applied; saved updates collect in a Saved pill, second in the feed's pill row. There is no "Your saved items" page (Braintrust's shape), because the
 * product has nowhere for one to hang — the navbar's avatar is inert and there
 * is no account menu — and because both surfaces already have the tab strip
 * this product uses for a personal scope on a listing (All / Applied here,
 * All / Following on teams, "Saved" as an activity filter on Demo Day's list).
 * Peerlist, Wellfound, Mercor and Remote keep saved jobs on the board;
 * Substack and Digg keep saved reading in the reader. One new control per
 * surface — the bookmark — and one new scope per surface, both in slots that
 * already exist.
 *
 * **One store, two surfaces.** `useSavedItems` keeps every kept uid with its
 * kind and a stamp in sessionStorage, so a save made on the board is there
 * when the reviewer switches to the feed, and a fresh tab opens on the seeds.
 *
 * **The receipt.** Saving fills the bookmark blue in place; the toast adds
 * the one thing the icon cannot say — where the thing went — as a link into
 * that surface's Saved scope (Glassdoor's "saved in Your Activity · View").
 * Unsaving is quiet: the outline coming back is the whole of that receipt.
 *
 * The **surface switch** is review scaffolding, in the board's own review
 * band under the navbar: the two surfaces are two routes in the product and
 * one route here. `?view=feed` deep-links the second; the navbar's Home item
 * switches to it too, since that is what Home is.
 */
type Surface = 'jobs' | 'feed';
const SURFACE_PARAM = 'view';

const SURFACE_OPTIONS: Array<{ value: Surface; label: string }> = [
  { value: 'jobs', label: 'Job board' },
  { value: 'feed', label: 'Newsfeed' },
];

const SURFACE_NOTE: Record<Surface, string> = {
  jobs: 'Bookmark a role from its row. Kept roles collect in the Saved tab beside Applied.',
  feed: 'Bookmark a story or post from its card. Kept updates collect under the Saved pill.',
};

/** What the toast's link is called on each surface — the tab it opens. */
const SAVED_NOUN: Record<Surface, string> = { jobs: 'View saved roles', feed: 'View saved updates' };

/** Hydrated yet? The server snapshot is false, the client's true — a mount gate
 *  with no effect and no state, which is what the lint asks for. */
const useMounted = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

const surfaceFromUrl = (): Surface =>
  new URLSearchParams(window.location.search).get(SURFACE_PARAM) === 'feed' ? 'feed' : 'jobs';

export default function SavingPrototype() {
  const mounted = useMounted();
  /* The switch's own choice, once made; until then the URL decides (read only
     after hydration, so the server and first client render agree on 'jobs'). */
  const [chosen, setSurface] = useState<Surface | null>(null);
  const surface: Surface = chosen ?? (mounted ? surfaceFromUrl() : 'jobs');
  const saved = useSavedItems();
  /** The save receipt: which surface it came from, and the way into its tab. */
  const [toast, setToast] = useState<{ surface: Surface; jump: () => void } | null>(null);

  // Mirror the surface into the URL, replaceState so nothing refetches.
  useEffect(() => {
    if (!mounted) return;
    const p = new URLSearchParams(window.location.search);
    if (surface === 'feed') p.set(SURFACE_PARAM, 'feed');
    else p.delete(SURFACE_PARAM);
    const qs = p.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [surface, mounted]);

  // Auto-dismiss, like the follow receipt it wears.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const onSaved = (jump: () => void) => setToast({ surface, jump });

  const onFeed = surface === 'feed';
  const nav = (
    <>
      <PrototypeNavBar hasUnreadNews={!onFeed} onNewsClick={() => setSurface('feed')} active={onFeed} />
      <PrototypeMobileNav hasUnreadNews={!onFeed} onNewsClick={() => setSurface('feed')} active={onFeed} />
    </>
  );

  const reviewControls = (
    <div className={jb.reviewBand}>
      <div className={jb.versionRow}>
        <div className={v0.switchBar}>
          <span className={v0.switchLabel}>Surface</span>
          <div className={v0.switch} role="tablist" aria-label="Surface">
            {SURFACE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={surface === opt.value}
                className={clsx(v0.switchBtn, surface === opt.value && v0.switchBtnActive)}
                onClick={() => setSurface(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className={v0.switchNote}>{SURFACE_NOTE[surface]}</span>
        </div>
      </div>
    </div>
  );

  if (!mounted) {
    return (
      <>
        {nav}
        <div className={jb.mountGate} />
      </>
    );
  }

  return (
    <>
      {nav}
      {reviewControls}

      {onFeed ? <SavedNewsfeed saved={saved} onSaved={onSaved} /> : <SavedJobBoard saved={saved} onSaved={onSaved} />}

      {toast && (
        <FollowToast>
          Saved.{' '}
          <button
            type="button"
            className={s.toastLink}
            onClick={() => {
              toast.jump();
              setToast(null);
            }}
          >
            {SAVED_NOUN[toast.surface]}
          </button>
        </FollowToast>
      )}
    </>
  );
}
