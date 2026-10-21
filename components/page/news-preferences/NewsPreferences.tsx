'use client';

/**
 * Settings → News preferences (LAB-2939/2941): what shapes For You on Home and
 * the news in the email digest. Ported from prototypes/entries/digest-topics.
 *
 *   Categories ............. the 6 backend news types; narrow For You and the
 *                            digest's picks, never the All tab on Home
 *   Suggested from profile . the member's teams and the attributes For You and
 *                            the digest match on (read-only; skills aren't used)
 *   Teams you follow ....... FollowButton; an unfollowed row stays until the page
 *                            is left, so it can be undone in place
 *
 * Arriving from the digest or the feed (`from`) outlines the biggest gap until
 * the first change: no followed teams → Teams you follow, else Categories.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useQueryClient } from '@tanstack/react-query';

import formCss from '@/components/page/email-preferences/components/EmailPreferencesForm/EmailPreferencesForm.module.scss';
import toggleCss from '@/components/page/email-preferences/components/Newsletter/Newsletter.module.scss';
import { FollowButton } from '@/components/ui/FollowButton';
import { getEventTypeConfig } from '@/components/page/home/TeamNews/utils/getEventTypeConfig';
import { useSettingsAnalytics, type NewsPreferencesArrival } from '@/analytics/settings.analytics';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useSetNewsCategories } from '@/services/members/hooks/useSetNewsCategories';
import { useFollowedTeams } from '@/services/follow/hooks/useFollowedTeams';
import { useFollowTeam } from '@/services/follow/hooks/useFollowTeam';
import { followedTeamUidsQueryKey } from '@/services/follow/hooks/useFollowedTeamUids';
import { toast } from '@/components/core/ToastContainer';
import type { TeamNewsEventType } from '@/types/team-news.types';
import { NEWS_PREFERENCE_CATEGORIES } from '@/utils/news-categories';
import { triggerLoader } from '@/utils/common.utils';

import type { NewsTeamSignal } from './buildTeamSignals';
import s from './NewsPreferences.module.scss';

type Gap = 'teams' | 'categories';
type Saved = null | 'categories' | 'teams';

interface Props {
  uid: string;
  from: NewsPreferencesArrival;
  /** Server-read categories, until the client query has its own. */
  initialCategories: TeamNewsEventType[];
  signals: NewsTeamSignal[];
}

export function NewsPreferences({ uid, from, initialCategories, signals }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const analytics = useSettingsAnalytics();
  const { data: preferences } = useGetMemberPreferences(uid);
  const setNewsCategories = useSetNewsCategories(uid);
  const { data: followedTeams, isPending: followsPending } = useFollowedTeams(uid);
  const { mutateAsync: toggleFollowRequest } = useFollowTeam();

  // The page's own copy of the choice: a click shows at once even before the
  // preferences query has loaded (nothing in the cache to patch yet), and a
  // failed save puts back exactly what was on screen.
  const [localCategories, setLocalCategories] = useState<TeamNewsEventType[] | null>(null);
  const categories: TeamNewsEventType[] = localCategories ?? preferences?.newsCategories ?? initialCategories;
  const [unfollowed, setUnfollowed] = useState<Set<string>>(() => new Set());
  const [pendingTeam, setPendingTeam] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<Saved>(null);

  const refs = { categories: useRef<HTMLDivElement>(null), teams: useRef<HTMLDivElement>(null) };

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
  const gap: Gap = follows.length === 0 ? 'teams' : 'categories';
  const arriving = from !== 'settings' && !touched && !followsPending;

  useEffect(() => {
    if (!arriving) return;
    refs[gap].current?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    // Only when the follows first settle; later changes end the arrival anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followsPending]);

  const lit = (g: Gap) => arriving && gap === g;
  const allOn = categories.length === NEWS_PREFERENCE_CATEGORIES.length;
  const arrivalWhere = from === 'digest' ? 'your digest' : 'For You';

  const saveCategories = (next: TeamNewsEventType[]) => {
    const previous = categories;
    setTouched(true);
    setLocalCategories(next);
    setNewsCategories(next, {
      onSuccess: () => setSaved('categories'),
      onError: () => {
        setLocalCategories(previous);
        analytics.onNewsPreferencesSaveFailed({ section: 'categories' });
      },
    });
  };

  const toggleCategory = (category: TeamNewsEventType) => {
    const on = categories.includes(category);
    if (on && categories.length === 1) return; // at least one stays on; the chip is disabled anyway
    const next = NEWS_PREFERENCE_CATEGORIES.filter((c) => (c === category ? !on : categories.includes(c)));
    analytics.onNewsPreferencesCategoryToggled({ category, on: !on, from });
    saveCategories(next);
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

  const followingCount = follows.filter((t) => !unfollowed.has(t.uid)).length;

  return (
    <div className={formCss.root}>
      <div className={s.pageHead}>
        <h5 className={formCss.title}>News Preferences</h5>
        <p className={s.pageIntro}>These shape For You on Home and the news in your email digest.</p>
      </div>

      {/* Categories */}
      <div ref={refs.categories} className={clsx(toggleCss.root, s.card, lit('categories') && s.cardHighlight)}>
        <div className={clsx(toggleCss.header, s.cardHeader)}>
          Categories
          {saved === 'categories' && <SavedNote />}
        </div>
        <div className={toggleCss.content}>
          {lit('categories') && <p className={s.arrivalNote}>Choose the kinds of news you want in {arrivalWhere}.</p>}
          <div className={s.rowHead}>
            <div className={toggleCss.desc}>
              {allOn
                ? 'You get every kind of news. Browsing All on Home always shows everything.'
                : `You get ${categories.length} of ${NEWS_PREFERENCE_CATEGORIES.length} kinds of news. Browsing All on Home always shows everything.`}
            </div>
            {!allOn && (
              <button
                type="button"
                className={s.inlineLink}
                onClick={() => saveCategories([...NEWS_PREFERENCE_CATEGORIES])}
              >
                Select all
              </button>
            )}
          </div>
          <div className={s.chips} role="group" aria-label="News categories">
            {NEWS_PREFERENCE_CATEGORIES.map((c) => {
              const on = categories.includes(c);
              const last = on && categories.length === 1;
              const { label } = getEventTypeConfig(c);
              return (
                <button
                  key={c}
                  type="button"
                  className={clsx(s.chip, on && s.chipOn)}
                  aria-pressed={on}
                  disabled={last}
                  title={last ? 'Keep at least one category' : undefined}
                  onClick={() => toggleCategory(c)}
                >
                  {on ? <CheckIcon /> : <PlusIcon />}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Suggested from your profile */}
      <div className={clsx(toggleCss.root, s.card)}>
        <div className={toggleCss.header}>Suggested from your profile</div>
        <div className={toggleCss.content}>
          <div className={toggleCss.desc}>
            We also suggest news from teams that share these with your team. They&apos;re set on the team&apos;s
            profile.
          </div>
          {signals.length > 0 ? (
            <dl className={s.signals}>
              {signals.map((team) => {
                const values = [...team.focusAreas, ...team.industryTags, ...team.communities];
                return (
                  <div key={team.teamUid} className={s.signal}>
                    <dt className={s.signalLabel}>
                      <Link href={`/teams/${team.teamUid}`} className={s.inlineLink}>
                        {team.teamName}
                      </Link>
                    </dt>
                    <dd className={s.signalValue}>
                      {values.length > 0 ? (
                        <span>{values.join(', ')}</span>
                      ) : (
                        <span className={s.signalEmpty}>No focus areas or tags yet</span>
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          ) : (
            <p className={s.emptyLine}>
              You&apos;re not on a team, so suggestions come only from the teams you follow.
            </p>
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
