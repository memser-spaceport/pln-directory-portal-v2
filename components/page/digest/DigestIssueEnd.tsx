import Link from 'next/link';
import { Check, MegaphoneSimple } from '@phosphor-icons/react';

import { formatDigestDate } from './DigestHeader';

import s from './DigestPage.module.scss';

/** "You're all caught up" (LAB-3287): the end of the issue, when the next one comes, and where to keep reading. */
export function DigestCaughtUp({ nextSendAt }: { nextSendAt: string | null }) {
  const next = nextSendAt ? formatDigestDate(nextSendAt, 'weekday') : '';
  return (
    <section className={s.caughtUp} aria-label="End of this issue">
      <span className={s.caughtUpMark} aria-hidden>
        <Check size={16} weight="bold" />
      </span>
      <p className={s.caughtUpTitle}>You’re all caught up</p>
      {next && <p className={s.caughtUpText}>The next digest arrives on {next}.</p>}
      <Link href="/" className={s.caughtUpLink}>
        See all network news
      </Link>
    </section>
  );
}

type TeamNewsCardProps = {
  onPost: () => void;
  note?: string | null;
  /** A member on more than one team picks the team to post as (LAB-3313); `null` hides the question. */
  teams?: { uid: string; name: string }[] | null;
  onChooseTeam?: (team: { uid: string; name: string }) => void;
};

/**
 * "Got news from your team?" (LAB-3287), for team members: an outlined card whose CTA opens the Post news modal.
 * "Post", not "Send": nobody reviews the post first, it goes straight onto the feed.
 */
export function DigestTeamNewsCard({ onPost, note, teams, onChooseTeam }: TeamNewsCardProps) {
  return (
    <section className={s.sendNews} aria-label="Post your team news">
      <span className={s.sendNewsIcon} aria-hidden>
        <MegaphoneSimple size={20} />
      </span>
      <div className={s.sendNewsBody}>
        <p className={s.sendNewsTitle}>Got news from your team?</p>
        <p className={s.sendNewsText}>
          Post it here and it goes straight onto the network feed. The best of the week makes the next digest.
        </p>
        <button type="button" className={s.sendNewsLink} onClick={onPost}>
          Post your team news →
        </button>
        {teams && teams.length > 0 && (
          <div className={s.sendNewsTeams} role="group" aria-label="Post as">
            <p className={s.sendNewsNote}>Post as</p>
            <ul className={s.sendNewsTeamList}>
              {teams.map((team) => (
                <li key={team.uid}>
                  <button type="button" className={s.sendNewsTeam} onClick={() => onChooseTeam?.(team)}>
                    {team.name || 'Your team'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {note && (
          <p className={s.sendNewsNote} role="status">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}
