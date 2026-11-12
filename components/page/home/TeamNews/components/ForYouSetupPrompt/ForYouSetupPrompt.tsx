'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { ALL_CAT, ALL_TAB } from '@/components/page/home/TeamNews/constants';

import s from './ForYouSetupPrompt.module.scss';

interface ForYouSetupPromptProps {
  memberUid?: string;
  /** False while a tab, category, topic filter or search is on. The row stays mounted so "shown" fires once. */
  visible: boolean;
  className?: string;
}

/** Home's All view, with no focus-area tab, category, topic filter or search. */
export function isForYouSetupVisible({
  preferencesOn,
  signedIn,
  forYouHasNoInputs,
  activeTab,
  activeCategory,
  query,
  hasTopicFilter,
}: {
  preferencesOn: boolean;
  signedIn: boolean;
  forYouHasNoInputs: boolean;
  activeTab: string;
  activeCategory: string;
  query: string;
  hasTopicFilter: boolean;
}): boolean {
  return (
    preferencesOn &&
    signedIn &&
    forYouHasNoInputs &&
    activeTab === ALL_TAB &&
    activeCategory === ALL_CAT &&
    query.trim() === '' &&
    !hasTopicFilter
  );
}

/**
 * The line for a signed-in member For You cannot match yet (LAB-3080). It sits on the page ground, not the hint slab,
 * and opens News preferences. It does not use the hint's Update event.
 */
export function ForYouSetupPrompt({ memberUid, visible, className }: ForYouSetupPromptProps) {
  const { onTeamNewsForYouSetupClicked, onTeamNewsForYouSetupShown } = useTeamNewsAnalytics();
  const shownFor = useRef<string | null>(null);

  useEffect(() => {
    if (!visible || !memberUid || shownFor.current === memberUid) return;
    shownFor.current = memberUid;
    onTeamNewsForYouSetupShown(memberUid);
  }, [visible, memberUid, onTeamNewsForYouSetupShown]);

  if (!visible || !memberUid) return null;

  return (
    <div className={clsx(s.root, className)}>
      <p className={s.text}>
        <span className={s.label}>For you</span>
        {' · '}
        Get news picked for you. Choose your topics and teams in News preferences.
      </p>
      <Link
        href="/settings/news-preferences?from=feed"
        className={s.link}
        aria-label="Open News preferences →"
        onClick={() => onTeamNewsForYouSetupClicked(memberUid)}
      >
        Open News preferences
        <svg className={s.arrow} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2.5 7h9M8 3.5 11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
        </svg>
      </Link>
    </div>
  );
}
