import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { SettingsMenu } from '@/components/page/settings/SettingsMenu';
import SettingsBackButton from '@/components/page/settings/settings-back-btn';
import { NewsPreferences, buildTeamSignals, pickSignalTeamUids } from '@/components/page/news-preferences';
import type { NewsPreferencesArrival } from '@/analytics/settings.analytics';
import { getMemberInfo } from '@/services/members.service';
import { getMemberPreferences } from '@/services/preferences.service';
import { getTeam } from '@/services/teams.service';
import { getCookiesFromHeaders } from '@/utils/next-helpers';
import { NEWS_PREFERENCE_CATEGORIES, SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import { SOCIAL_IMAGE_URL } from '@/utils/constants';
import styles from './page.module.css';

const ARRIVALS: NewsPreferencesArrival[] = ['digest', 'feed', 'settings'];

/** Settings → News preferences (LAB-2939/2941). */
async function NewsPreferencesPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  if (!SHOW_NEWS_PREFERENCES) notFound();

  const [{ isLoggedIn, userInfo, authToken }, resolvedSearchParams] = await Promise.all([
    getCookiesFromHeaders(),
    searchParams,
  ]);
  const params = new URLSearchParams(resolvedSearchParams).toString();

  if (!isLoggedIn) {
    redirect(`/${params ? `?${params}` : '?'}&returnTo=settings-news-preferences#login`);
  }

  const from = ARRIVALS.includes(resolvedSearchParams.from as NewsPreferencesArrival)
    ? (resolvedSearchParams.from as NewsPreferencesArrival)
    : 'settings';

  const [preferences, memberInfo] = await Promise.all([
    getMemberPreferences(userInfo.uid, authToken).catch(() => null),
    getMemberInfo(userInfo.uid, authToken).catch(() => null),
  ]);
  const initialCategories = (preferences && 'newsCategories' in preferences
    ? preferences.newsCategories
    : undefined) ?? [...NEWS_PREFERENCE_CATEGORIES];

  // What For You and the digest match on: each of the member's teams (main
  // team first, at most 5), one team request each.
  const teamUids = pickSignalTeamUids(memberInfo && 'data' in memberInfo ? memberInfo.data?.teamMemberRoles : []);
  const teams = await Promise.all(
    teamUids.map((teamUid) =>
      getTeam(teamUid, {}, authToken)
        .then((result: any) => result?.data?.formatedData ?? null)
        .catch(() => null),
    ),
  );
  const signals = buildTeamSignals(teams);

  const roles = userInfo.roles ?? [];
  const isAdmin = roles.includes('DIRECTORYADMIN');
  const isTeamLead = (userInfo.leadingTeams ?? []).length > 0;

  return (
    <div className={styles.privacy}>
      <div className={styles.privacy__backbtn}>
        <SettingsBackButton title="News Preferences" />
      </div>
      <div className={styles.privacy__main}>
        <aside className={styles.privacy__main__aside}>
          <SettingsMenu isTeamLead={isTeamLead} isAdmin={isAdmin} userInfo={userInfo} />
        </aside>
        <div className={styles.privacy__main__content}>
          <NewsPreferences uid={userInfo.uid} from={from} initialCategories={initialCategories} signals={signals} />
        </div>
      </div>
    </div>
  );
}

export default NewsPreferencesPage;

export const metadata: Metadata = {
  title: 'News Preferences | Protocol Labs Directory',
  description: 'Choose the news that shapes For You and your email digest.',
  openGraph: {
    type: 'website',
    url: process.env.APPLICATION_BASE_URL,
    images: [
      {
        url: SOCIAL_IMAGE_URL,
        width: 1280,
        height: 640,
        alt: 'Protocol Labs Directory',
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [SOCIAL_IMAGE_URL],
  },
};
