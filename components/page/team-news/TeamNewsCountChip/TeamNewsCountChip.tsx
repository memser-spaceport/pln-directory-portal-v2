'use client';

import { useEffect, useRef } from 'react';

import { Badge } from '@/components/common/Badge';
import { useTeamNewsAnalytics, type TeamNewsCountChipSource } from '@/analytics/team-news.analytics';
import { useTeamNewsCount } from '@/services/team-news/hooks/useTeamNewsCounts';

import s from './TeamNewsCountChip.module.scss';

interface TeamNewsCountChipProps {
  teamUid: string;
  teamName: string;
  /** Which listing this chip is riding, for analytics. */
  source: TeamNewsCountChipSource;
  /**
   * List this team's news where the reader already is. Not a destination the
   * caller picks: this chip means one thing everywhere it appears, and the
   * surface that owns the modal state just has to hold it.
   */
  onOpen: (teamUid: string, teamName: string) => void;
}

/**
 * "N new posts" — how much a team has published lately, on the teams grid and
 * the job board alike.
 *
 * Reads the count itself rather than taking it as a prop. That keeps the card
 * components ignorant of the counts cache, and means a team's number landing
 * re-renders exactly this chip instead of the whole grid — the same split the
 * feed's CommentButton uses against the same kind of shared entry. The bulk
 * request is mounted once per page by useTeamNewsCounts; this only observes.
 *
 * Renders nothing at zero AND at unknown. They are different wire states — the
 * server omits teams with nothing recent, so absence and zero arrive
 * identically — but a chip is a claim that something is waiting, and neither
 * state supports one. "0 new posts" is an empty promise.
 *
 * Clicking opens the team's news in place. A count is an amount, and a reader
 * asking how much is waiting hasn't asked to be moved off the list they were
 * scanning; the modal's own footer carries the way on to the feed for whoever
 * does want it.
 */
export function TeamNewsCountChip({ teamUid, teamName, source, onOpen }: TeamNewsCountChipProps) {
  const count = useTeamNewsCount(teamUid);
  const { onTeamNewsCountChipClicked, onTeamNewsCountChipShown } = useTeamNewsAnalytics();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!count) {
      shownRef.current = false;
      return;
    }
    if (shownRef.current) return;
    shownRef.current = true;
    onTeamNewsCountChipShown(teamUid, teamName, count, source);
  }, [count, teamUid, teamName, source, onTeamNewsCountChipShown]);

  if (!count) return null;

  const text = `${count} new post${count === 1 ? '' : 's'}`;

  return (
    <button
      type="button"
      className={s.link}
      // The chip sits inside a card that is itself one big link, so it has to
      // beat that link to the click. TeamList's handler already opens with
      // `if (e.defaultPrevented) return`, so preventDefault is the documented
      // way through; stopPropagation covers the wrapper's own onClick.
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Reported here rather than by the caller because the count is the offer
        // — a click-through rate only reads against it, and this is the only
        // component that knows the number.
        onTeamNewsCountChipClicked(teamUid, teamName, count, source);
        onOpen(teamUid, teamName);
      }}
      // The chip sits beside the team's name, so the visible text reads right on
      // screen; the accessible name still has to stand on its own out of
      // context — and must START with what's visible (WCAG 2.5.3, Label in
      // Name), or voice control can't act on what the user can read.
      aria-label={`${text} about ${teamName} — read them`}
    >
      <Badge variant="default" className={s.chip}>
        <span className={s.dot} aria-hidden="true" />
        {text}
      </Badge>
    </button>
  );
}
