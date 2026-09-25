'use client';

import { Button } from '@/components/common/Button';

import { PlTeamOnlyPill } from '../profile-shared/PlTeamOnlyPill';
import { InvestorPathRow, InvestorTableHead } from '../warm-intros-founders/InvestorPathRow';
import { IntroViaLine } from '../warm-intros-founders/IntroViaLine';
import { FOUNDER_TEAM, INVESTOR_ROWS, investorProfileHref } from '../warm-intros-founders/mocks';
import { useAskIntro } from '../warm-intros-founders/useAskIntro';
import table from '../warm-intros-founders/WarmIntrosFounders.module.scss';
import door from '../warm-intros-founders/IntroDoors.module.scss';

import type { IntroPathsBlock } from './mocks';

/**
 * The `intros` answer block: the investors an answer named, as the founder's
 * own Fundraising rows — who they are, the one person who can make the intro,
 * and "Ask for intro".
 *
 * Nothing is redrawn. The row, its column head, the ask form and the list of
 * asks are `warm-intros-founders`' own, so an investor already asked from the
 * team page arrives here as "Requested", and an ask sent here is in the
 * Fundraising section afterwards. That section is where asks are followed, so
 * the block ends on a door to it rather than growing a status list of its own
 * (the scoped answers' rule: a door, not a rival list).
 *
 * The pill carries the one fact the rows can't: a path is drawn for this
 * founder only. The answer builder never puts the block in anyone else's
 * answer — hiding it here would be the wrong layer to rely on.
 */
export function IntroPathsRows({ block }: { block: IntroPathsBlock }) {
  const { askFor, ask, setStatus, modal } = useAskIntro();
  const rows = block.investorUids.flatMap((uid) => INVESTOR_ROWS.find((row) => row.uid === uid) ?? []);

  /* Nobody in between: one line, nothing to press (see `noPathTo`). */
  if (block.noPathTo) {
    return <p className={door.answerNoPath}>No one in the network can introduce you to {block.noPathTo} yet.</p>;
  }
  if (!rows.length) return null;

  /* The answer is about this investor: the profile's own intro block, not a
     one-row table that names them again under a column head. */
  if (block.compact) {
    const row = rows[0];
    return (
      <div className={door.answerCompact}>
        <div className={door.answerHead}>
          <p className={door.answerTitle}>Warm intro to {row.name.split(' ')[0]}</p>
          <PlTeamOnlyPill />
        </div>
        <IntroViaLine
          row={row}
          ask={askFor(row.uid)}
          onAsk={() => ask(row)}
          onAskAlternate={() => row.alternate && ask(row, row.alternate.connector)}
          onMarkMet={() => setStatus(row.uid, 'met')}
          plain
        />
        {modal}
      </div>
    );
  }

  return (
    <div className={door.answerBlock}>
      <div className={door.answerHead}>
        <p className={door.answerTitle}>Warm intros for {FOUNDER_TEAM.name}</p>
        <PlTeamOnlyPill />
      </div>

      <div className={table.table}>
        <InvestorTableHead />
        {rows.map((row) => (
          <InvestorPathRow
            key={row.uid}
            row={row}
            ask={askFor(row.uid)}
            href={investorProfileHref(row.uid)}
            onAsk={() => ask(row)}
            onAskAlternate={() => row.alternate && ask(row, row.alternate.connector)}
            onMarkMet={() => setStatus(row.uid, 'met')}
          />
        ))}
      </div>

      <div className={door.answerDoor}>
        <Button
          style="border"
          variant="neutral"
          size="xs"
          onClick={() => window.location.assign('/prototypes/warm-intros-founders')}
        >
          Open Fundraising
        </Button>
      </div>

      {modal}
    </div>
  );
}
