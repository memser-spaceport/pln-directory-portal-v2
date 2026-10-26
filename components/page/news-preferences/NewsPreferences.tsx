'use client';

/**
 * Settings → News preferences (LAB-2939/2941; tags since LAB-3000): what shapes
 * For You on Home and the news in the email digest. Ported from
 * prototypes/entries/digest-topics.
 *
 *   Tags ................... focus areas used by news (`GET /v1/team-news/tags`);
 *                            the member's own first, then the rest grouped under
 *                            their top-level focus area. A member who never saved
 *                            starts with their teams' focus areas (seeded)
 *   Teams you follow ....... FollowButton; an unfollowed row stays until the page
 *                            is left, so it can be undone in place
 *
 * Arriving from the digest or the feed (`from`) outlines the biggest gap until
 * the first change: no followed teams → Teams you follow, else Tags.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useQueryClient } from '@tanstack/react-query';

import formCss from '@/components/page/email-preferences/components/EmailPreferencesForm/EmailPreferencesForm.module.scss';
import toggleCss from '@/components/page/email-preferences/components/Newsletter/Newsletter.module.scss';
import { FollowButton } from '@/components/ui/FollowButton';
import { useSettingsAnalytics, type NewsPreferencesArrival } from '@/analytics/settings.analytics';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useSetNewsTags } from '@/services/members/hooks/useSetNewsTags';
import { useNewsTags } from '@/services/team-news/hooks/useNewsTags';
import { useFollowedTeams } from '@/services/follow/hooks/useFollowedTeams';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { followedTeamUidsQueryKey } from '@/services/follow/hooks/useFollowedTeamUids';
import { toast } from '@/components/core/ToastContainer';
import type { INewsTag } from '@/types/team-news.types';
import { triggerLoader } from '@/utils/common.utils';

import s from './NewsPreferences.module.scss';

type Gap = 'teams' | 'tags';
type Saved = null | 'tags' | 'teams';

interface Props {
  uid: string;
  from: NewsPreferencesArrival;
  /** Server-read tags, until the client query has its own. */
  initialTags: string[];
  /** True when `initialTags` were seeded from the member's teams (never saved). */
  initialTagsSeeded: boolean;
}

export function NewsPreferences({ uid, from, initialTags, initialTagsSeeded }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const analytics = useSettingsAnalytics();
  const { data: preferences } = useGetMemberPreferences(uid);
  const { data: tagGroups, isError: tagListFailed } = useNewsTags();
  const setNewsTags = useSetNewsTags(uid);
  const { data: followedTeams, isPending: followsPending } = useFollowedTeams(uid);
  const { mutateAsync: toggleFollowRequest } = useFollowTeam();

  // The page's own copy of the choice: a click shows at once even before the
  // preferences query has loaded (nothing in the cache to patch yet), and a
  // failed save puts back exactly what was on screen.
  const [localTags, setLocalTags] = useState<string[] | null>(null);
  const tags: string[] = localTags ?? preferences?.newsTags ?? initialTags;
  const seeded = localTags === null && (preferences ? preferences.newsTagsSeeded : initialTagsSeeded);
  // The member's own tags lead, in the order they had when the page opened, so
  // a chip never jumps when it is toggled.
  const [pinned] = useState<string[]>(() => initialTags);
  const [unfollowed, setUnfollowed] = useState<Set<string>>(() => new Set());
  const [pendingTeam, setPendingTeam] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<Saved>(null);

  const refs = { tags: useRef<HTMLDivElement>(null), teams: useRef<HTMLDivElement>(null) };

  useEffect(() => {
    triggerLoader(false);
    function handleNavigate(e: any) {
      triggerLoader(true);
      router.push(e.detail.url);
      router.refresh();
    }
    document.addEventListener('settings-navigate', handleNavigate);
    return () => document.removeEventListener('settings-navigate', handleNavigate);
  }, [router]);

  useEffect(() => {
    analytics.onNewsPreferencesOpened(from);
    // Once per visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!saved) return;
    const t = window.setTimeout(() => setSaved(null), 2000);
    return () => window.clearTimeout(t);
  }, [saved]);

  const follows = useMemo(() => followedTeams ?? [], [followedTeams]);
  const gap: Gap = follows.length === 0 ? 'teams' : 'tags';
  const arriving = from !== 'settings' && !touched && !followsPending;

  useEffect(() => {
    if (!arriving) return;
    refs[gap].current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    // Only when the follows first settle; later changes end the arrival anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followsPending]);

  const lit = (g: Gap) => arriving && gap === g;
  const arrivalWhere = from === 'digest' ? 'your digest' : 'For You';

  const titles = useMemo(() => {
    const map = new Map<string, string>();
    for (const group of tagGroups ?? []) {
      map.set(group.slug, group.title);
      for (const child of group.children) map.set(child.slug, child.title);
    }
    return map;
  }, [tagGroups]);
  // A chosen tag that news no longer uses isn't in the list: it shows by slug.
  const titleOf = (slug: string) => titles.get(slug) ?? slug;

  // Everything not pinned, under its top-level focus area (the parent is a chip too).
  const groups = useMemo(
    () =>
      (tagGroups ?? [])
        .map((group) => ({
          slug: group.slug,
          title: group.title,
          tags: [{ slug: group.slug, title: group.title }, ...group.children].filter(
            (tag: INewsTag) => !pinned.includes(tag.slug),
          ),
        }))
        .filter((group) => group.tags.length > 0),
    [tagGroups, pinned],
  );

  const saveTags = (next: string[]) => {
    const previous = tags;
    setTouched(true);
    setLocalTags(next);
    setNewsTags(next, {
      onSuccess: () => setSaved('tags'),
      onError: () => {
        setLocalTags(previous);
        analytics.onNewsPreferencesSaveFailed({ section: 'tags' });
      },
    });
  };

  const toggleTag = (slug: string) => {
    const on = tags.includes(slug);
    analytics.onNewsPreferencesTagToggled({ tag: slug, on: !on, from });
    saveTags(on ? tags.filter((t) => t !== slug) : [...tags, slug]);
  };

  const toggleFollow = async (teamUid: string) => {
    if (pendingTeam) return;
    const following = !unfollowed.has(teamUid);
    const flip = (set: Set<string>) => {
      const nextSet = new Set(set);
      if (nextSet.has(teamUid)) nextSet.delete(teamUid);
      else nextSet.add(teamUid);
      return nextSet;
    };
    setTouched(true);
    setPendingTeam(teamUid);
    setUnfollowed(flip); // optimistic
    analytics.onNewsPreferencesFollowToggled({ teamUid, following: !following, from });
    const result = await toggleFollowRequest({ teamUid, action: following ? 'unfollow' : 'follow' }).catch(() => null);
    setPendingTeam(null);
    if (!result) {
      setUnfollowed(flip); // revert
      toast.error('Could not update this team. Please try again.');
      analytics.onNewsPreferencesSaveFailed({ section: 'teams', teamUid });
      return;
    }
    // The rest of the app reads follows from this set (staleTime Infinity).
    queryClient.invalidateQueries({ queryKey: followedTeamUidsQueryKey(uid) });
    setSaved('teams');
  };

  const SavedNote = () => (
    <span className={s.saved} role="status">
      <CheckIcon /> Saved
    </span>
  );

  // A render function, not a component: a component defined here would remount
  // every chip on each render and drop keyboard focus after a toggle.
  const renderTagChip = ({ slug, title }: INewsTag) => {
    const on = tags.includes(slug);
    return (
      <button
        key={slug}
        type="button"
        className={clsx(s.chip, on && s.chipOn)}
        aria-pressed={on}
        title={on ? `Remove ${title}` : `Add ${title}`}
        onClick={() => toggleTag(slug)}
      >
        {on ? <CheckIcon /> : <PlusIcon />}
        {title}
      </button>
    );
  };

  const followingCount = follows.filter((t) => !unfollowed.has(t.uid)).length;

  return (
    <div className={formCss.root}>
      <div className={s.pageHead}>
        <h5 className={formCss.title}>News Preferences</h5>
        <p className={s.pageIntro}>These shape For You on Home and the news in your email digest.</p>
      </div>

      {/* Tags */}
      <div ref={refs.tags} className={clsx(toggleCss.root, s.card, lit('tags') && s.cardHighlight)}>
        <div className={clsx(toggleCss.header, s.cardHeader)}>
          Tags{tags.length > 0 && ` · ${tags.length}`}
          {saved === 'tags' && <SavedNote />}
        </div>
        <div className={toggleCss.content}>
          {lit('tags') && (
            <p className={s.arrivalNote}>
              {tags.length === 0
                ? `Add a few tags to get news that fits your work in ${arrivalWhere}.`
                : `Remove tags you don’t want in ${arrivalWhere}.`}
            </p>
          )}
          <div className={toggleCss.desc}>
            {seeded && 'We picked these from your teams’ focus areas. '}
            {tags.length > 0
              ? 'News tagged with them shows up in For You and your digest. Click a tag to add or remove it.'
              : 'You have no tags, so For You and your digest show news from your own and followed teams only. Add tags to get news on those topics.'}
          </div>
          {pinned.length > 0 && (
            <div className={s.chips} role="group" aria-label="Your tags">
              {pinned.map((slug) => renderTagChip({ slug, title: titleOf(slug) }))}
            </div>
          )}
          {groups.length > 0 && (
            <div className={s.tagGroups}>
              {groups.map((group) => (
                <div key={group.slug} className={s.tagGroup}>
                  <p className={s.tagGroupTitle}>{group.title}</p>
                  <div className={s.chips} role="group" aria-label={group.title}>
                    {group.tags.map(renderTagChip)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {tagListFailed && (
            <p className={s.emptyLine}>We couldn’t load the list of tags. Your tags above are still saved.</p>
          )}
        </div>
      </div>

      {/* Teams you follow */}
      <div ref={refs.teams} className={clsx(toggleCss.root, s.card, lit('teams') && s.cardHighlight)}>
        <div className={clsx(toggleCss.header, s.cardHeader)}>
          Teams you follow{follows.length > 0 && ` · ${followingCount}`}
          {saved === 'teams' && <SavedNote />}
        </div>
        <div className={toggleCss.content}>
          {lit('teams') && <p className={s.arrivalNote}>Follow teams to see their news in {arrivalWhere}.</p>}
          <div className={toggleCss.desc}>News from these teams shows up in For You and your digest.</div>
          {followsPending ? null : follows.length > 0 ? (
            <ul className={s.teams}>
              {follows.map((t) => {
                const following = !unfollowed.has(t.uid);
                return (
                  <li key={t.uid} className={s.team}>
                    {t.logoUrl ? (
                      <img src={t.logoUrl} alt="" width={32} height={32} className={s.teamLogo} />
                    ) : (
                      <span className={s.teamLogo} aria-hidden="true" />
                    )}
                    <div className={s.teamText}>
                      <Link href={`/teams/${t.uid}`} className={s.teamName}>
                        {t.name}
                      </Link>
                    </div>
                    <FollowButton
                      following={following}
                      name={t.name}
                      size="compact"
                      disabled={pendingTeam === t.uid}
                      onClick={() => toggleFollow(t.uid)}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={s.emptyLine}>
              You don&apos;t follow any teams yet.{' '}
              <Link href="/teams" className={s.inlineLink}>
                See teams to follow
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
