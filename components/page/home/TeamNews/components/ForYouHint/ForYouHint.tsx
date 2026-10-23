import Link from 'next/link';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { PAGE_ROUTES } from '@/utils/constants';
import { SHOW_NEWS_PREFERENCES } from '@/utils/news-categories';
import s from './ForYouHint.module.scss';

interface ForYouHintProps {
  memberUid?: string;
}

/**
 * For You's one-line explanation. "Tune For You" (LAB-2941) opens News
 * preferences, which holds the categories, the profile signals and the teams
 * followed. While that page is flagged off, the hint keeps its earlier link to
 * the member's profile.
 */
export function ForYouHint({ memberUid }: ForYouHintProps) {
  const { onTeamNewsForYouTuneClicked, onTeamNewsForYouUpdateProfileClicked } = useTeamNewsAnalytics();

  if (!memberUid) {
    return (
      <p className={s.root}>
        For you: Curated based on your profile, primary team attributes, and the teams you follow.
      </p>
    );
  }

  return (
    <p className={s.root}>
      For you: Curated based on your profile, primary team attributes, and the teams you follow.{' '}
      {SHOW_NEWS_PREFERENCES ? (
        <Link
          href="/settings/news-preferences?from=feed"
          className={s.link}
          onClick={() => onTeamNewsForYouTuneClicked(memberUid)}
        >
          Tune For You
        </Link>
      ) : (
        <>
          <Link
            href={`${PAGE_ROUTES.MEMBERS}/${memberUid}?backTo=${encodeURIComponent(PAGE_ROUTES.HOME)}`}
            className={s.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onTeamNewsForYouUpdateProfileClicked(memberUid)}
          >
            Update your profile
          </Link>{' '}
          to make it more relevant.
        </>
      )}
    </p>
  );
}
