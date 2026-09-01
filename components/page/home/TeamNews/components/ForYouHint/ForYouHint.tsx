import Link from 'next/link';

import { useTeamNewsAnalytics } from '@/analytics/team-news.analytics';
import { PAGE_ROUTES } from '@/utils/constants';

import s from './ForYouHint.module.scss';

interface ForYouHintProps {
  memberUid?: string;
}

export function ForYouHint({ memberUid }: ForYouHintProps) {
  const { onTeamNewsForYouUpdateProfileClicked } = useTeamNewsAnalytics();

  return (
    <p className={s.root}>
      For you: Curated based on your profile, primary team attributes, and the teams you follow.
      {memberUid ? (
        <>
          {' '}
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
      ) : null}
    </p>
  );
}
