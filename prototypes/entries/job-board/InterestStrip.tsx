'use client';

import { Button } from '@/components/common/Button';
import { InfoCircleIconOutlined, SuccessCircleIcon } from '@/components/icons';

import s from './InterestStrip.module.scss';

interface InterestStripProps {
  teamName: string;
  /** Whether interest has already been signalled for this role. */
  interested: boolean;
  onInterested: () => void;
  onUndo: () => void;
}

/**
 * The job aspirant's one act on a role: telling the team they are interested.
 *
 * Sits between the role's masthead and its description on the reading step,
 * for a signed-up aspirant only. An aspirant does not apply through this board
 * — the footer hands them to the team's own site — so what the profile buys
 * them here is visibility: the press marks the role, and the team is shown the
 * profile if the two match.
 *
 * Two states in one slot, traced from the Figma "Signed up — Review job" and
 * "Signed up — Clicked Interested" frames (658:10125 and 684:18216): the offer
 * with its outline button, and the green confirmation with an Undo. The undo
 * is a link in the alert rather than a second button, because taking the
 * signal back is the rarer act and should not price itself against the one
 * that gave it.
 */
export function InterestStrip({ teamName, interested, onInterested, onUndo }: InterestStripProps) {
  if (interested) {
    return (
      <div className={s.alert} role="status">
        <SuccessCircleIcon className={s.alertIcon} aria-hidden="true" />
        <p className={s.alertText}>The team will see it if you&apos;re a match</p>
        <button type="button" className={s.undo} onClick={onUndo}>
          Undo
        </button>
      </div>
    );
  }

  return (
    <div className={s.strip}>
      <div className={s.lead}>
        <span className={s.iconTile} aria-hidden="true">
          <InfoCircleIconOutlined className={s.icon} />
        </span>
        <div className={s.text}>
          <p className={s.title}>Let {teamName} know you&apos;re interested</p>
          <p className={s.sub}>We&apos;ll notify the team if you&apos;re a match and share your LabOS profile.</p>
        </div>
      </div>
      <Button variant="primary" style="border" size="m" className={s.button} onClick={onInterested}>
        I&apos;m interested
      </Button>
    </div>
  );
}
