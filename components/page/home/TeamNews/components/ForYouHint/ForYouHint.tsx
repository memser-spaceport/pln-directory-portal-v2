import Link from 'next/link';
import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import s from './ForYouHint.module.scss';

interface ForYouHintProps {
  memberUid?: string;
}

/**
 * For You's one-line explanation. "Tune For You" (LAB-2941) opens News
 * preferences, which holds the categories, the profile signals and the teams
 * followed; the profile link lives there now.
 */
export function ForYouHint({ memberUid }: ForYouHintProps) {
  const { onTeamNewsForYouTuneClicked } = useTeamNewsAnalytics();

  return (
    <p className={s.root}>
      For you: Curated based on your profile, primary team attributes, and the teams you follow.
      {memberUid ? (
        <>
          {' '}
          <Link
            href="/settings/news-preferences?from=feed"
            className={s.link}
            onClick={() => onTeamNewsForYouTuneClicked(memberUid)}
          >
            Tune For You
          </Link>
        </>
      ) : null}
    </p>
  );
}
