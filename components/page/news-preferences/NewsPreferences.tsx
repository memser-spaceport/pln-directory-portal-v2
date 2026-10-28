'use client';

/**
 * Settings → News preferences (LAB-2939/2941; tags since LAB-3000): what shapes
 * For You on Home and the news in the email digest. Ported from
 * prototypes/entries/digest-topics.
 *
 *   Topics ................. news tags (focus-area slugs used by news,
 *                            `GET /v1/team-news/tags`) as `#slug` chips in
 *                            themes, with a search (LAB-3023). A member who
 *                            never saved starts with their teams' focus areas
 *   Teams you follow ....... FollowButton; an unfollowed row stays until the page
 *                            is left, so it can be undone in place
 *
 * Arriving from the digest or the feed (`from`) outlines the biggest gap until
 * the first change: topics but no followed teams → Teams you follow, else Topics.
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
import { triggerLoader } from '@/utils/common.utils';
import { SearchIcon } from '@/components/icons';

import { groupNewsTags } from './newsTagThemes';
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
  // The tags the member had when the page opened stay listed even when the tag
  // list lacks them (no recent news), so removing one can be undone in place.
  const [pinned] = useState<string[]>(() => initialTags);
  const [query, setQuery] = useState('');
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
  const gap: Gap = tags.length > 0 && follows.length === 0 ? 'teams' : 'tags';
  const arriving = from !== 'settings' && !touched && !followsPending;

  useEffect(() => {
    if (!arriving) return;
    refs[gap].current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    // Only when the follows first settle; later changes end the arrival anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followsPending]);

  const lit = (g: Gap) => arriving && gap === g;
  const arrivalWhere = from === 'digest' ? 'your digest' : 'For You';

  // Every tag the page knows, in Polina's themes (LAB-3023); a chip keeps its
  // place when toggled.
  const allTags = useMemo(() => {
    const listed = (tagGroups ?? []).flatMap((group) => [group.slug, ...group.children.map((child) => child.slug)]);
    return [...new Set([...pinned, ...listed])];
  }, [tagGroups, pinned]);
  const themes = useMemo(() => groupNewsTags(allTags, query), [allTags, query]);

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
  const renderTagChip = (slug: string) => {
    const on = tags.includes(slug);
    return (
      <button
        key={slug}
        type="button"
        className={clsx(s.chip, on && s.chipOn)}
        aria-pressed={on}
        title={on ? `Unsubscribe from #${slug}` : `Subscribe to #${slug}`}
        onClick={() => toggleTag(slug)}
      >
        {on ? <CheckIcon /> : <PlusIcon />}#{slug}
      </button>
    );
  };

  const followingCount = follows.filter((t) => !unfollowed.has(t.uid)).length;

  return (
    <div className={formCss.root}>
      <div className={s.pageHead}>
        <h5 className={formCss.title}>News Preferences</h5>
        <p className={s.pageIntro}>
          These shape For You on Home and the news in your email digest. To change how often the digest arrives, go to{' '}
          <Link href="/settings/email" className={s.inlineLink}>
            Email Preferences
          </Link>
          .
        </p>
      </div>

      {/* Topics */}
      <div ref={refs.tags} className={clsx(toggleCss.root, s.card, lit('tags') && s.cardHighlight)}>
        {/* A question, not "Topics": with nothing picked it says the chips are there to choose from. */}
        <div className={clsx(toggleCss.header, s.cardHeader)}>
          What do you want news about?
          {saved === 'tags' && <SavedNote />}
        </div>
        <div className={toggleCss.content}>
          {lit('tags') && (
            <p className={s.arrivalNote}>
              {tags.length === 0
                ? `Subscribe to a few topics to get news that fits your work in ${arrivalWhere}.`
                : `Unsubscribe from topics you don’t want in ${arrivalWhere}.`}
            </p>
          )}
          <div className={toggleCss.desc}>
            {seeded && tags.length > 0 && 'We picked these from your teams’ focus areas. '}
            Pick a few tags. They shape For You and your digest.
          </div>
          {allTags.length > 0 && (
            <>
              <label className={s.search}>
                <input
                  type="search"
                  value={query}
                  placeholder="Search tags"
                  aria-label="Search tags"
                  className={s.searchInput}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => {
                    if (query.trim()) {
                      analytics.onNewsPreferencesTagSearched({
                        query: query.trim(),
                        matches: themes.reduce((n, theme) => n + theme.slugs.length, 0),
                      });
                    }
                  }}
                />
                <SearchIcon className={s.searchIcon} aria-hidden="true" />
              </label>
              <div className={s.themes} role="group" aria-label="Topics">
                {themes.map((theme) => (
                  <div key={theme.title} className={s.theme} role="group" aria-label={theme.title}>
                    <span className={s.themeTitle} aria-hidden="true">
                      {theme.title}
                    </span>
                    <div className={s.chips}>{theme.slugs.map(renderTagChip)}</div>
                  </div>
                ))}
                {themes.length === 0 && <p className={s.emptyLine}>No tags match “{query.trim()}”.</p>}
              </div>
            </>
          )}
          {tagListFailed && (
            <p className={s.emptyLine}>We couldn’t load the list of topics. Your topics are still saved.</p>
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
                      {t.focusAreas && t.focusAreas.length > 0 && (
                        <span className={s.teamMeta} title={t.focusAreas.join(', ')}>
                          {t.focusAreas.join(', ')}
                        </span>
                      )}
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
